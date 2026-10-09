import { updateSession, getSession } from '../sessions/sessionManager';
import { generateSimulation, repairSimulation, hasOpenAIKey } from '../agents/generationAgent';
import { generateMockSimulation } from '../agents/mockSimulation';
import { validateSimulation } from '../validation/validateSimulation';
import { selfCorrect } from '../validation/selfCorrect';
import type { GenerationStatus, GenerationStep, LearningBrief, Session } from '../types';

/**
 * Orchestrates simulation generation (spec §36–38). Generation runs in the
 * background; the frontend polls GET /status. Progress is held in memory and
 * the terminal outcome is also persisted to session.json so it survives a
 * restart.
 */

const STEP_MESSAGES: Record<GenerationStep, string> = {
  understanding: 'Understanding your learning need...',
  planning: 'Designing your demonstration...',
  creating_files: 'Building interactive simulation...',
  validating: 'Testing the simulation...',
  fixing: 'Fixing a few issues...',
  ready: 'Your interactive demonstration is ready',
  error: 'We couldn’t build the demonstration.',
};

const statusStore = new Map<string, GenerationStatus>();

function setStep(sessionId: string, step: GenerationStep): void {
  const status: GenerationStatus['status'] =
    step === 'ready' ? 'ready' : step === 'error' ? 'error' : 'generating';
  statusStore.set(sessionId, { status, step, message: STEP_MESSAGES[step] });
}

/** Current generation status; falls back to session.json after a restart. */
export async function getGenerationStatus(sessionId: string): Promise<GenerationStatus | null> {
  const live = statusStore.get(sessionId);
  if (live) return live;

  const session = await getSession(sessionId);
  if (!session) return null;
  if (session.simulation.status === 'ready') {
    return { status: 'ready', step: 'ready', message: STEP_MESSAGES.ready };
  }
  if (session.simulation.status === 'error') {
    return { status: 'error', step: 'error', message: STEP_MESSAGES.error };
  }
  return null;
}

async function runGeneration(sessionId: string, brief: LearningBrief): Promise<void> {
  try {
    setStep(sessionId, 'understanding');
    await updateSession(sessionId, {
      status: 'generating',
      subject: brief.subject,
      topic: brief.topic,
      simulation: { status: 'generating', entryPoint: 'simulation/index.html' },
    } as Partial<Session>);

    setStep(sessionId, 'planning');

    const online = hasOpenAIKey();
    const result = await selfCorrect({
      generate: async () => {
        if (online) await generateSimulation(sessionId, brief);
        else await generateMockSimulation(sessionId, brief);
      },
      repair: async (errors) => {
        await repairSimulation(sessionId, brief, errors);
      },
      validate: () => validateSimulation(sessionId),
      canRepair: online, // mock mode has no agent to repair with
      maxAttempts: 3, // spec §40
      onStep: (step) => {
        setStep(sessionId, step);
        if (step === 'validating') void updateSession(sessionId, { status: 'validating' });
      },
    });

    if (!result.ok) {
      throw new Error(
        `Validation failed after ${result.attempts} attempt(s): ${result.errors.join('; ')}`,
      );
    }

    setStep(sessionId, 'ready');
    await updateSession(sessionId, {
      status: 'ready',
      simulation: { status: 'ready', entryPoint: 'simulation/index.html' },
    });
  } catch (err) {
    setStep(sessionId, 'error');
    await updateSession(sessionId, {
      status: 'error',
      simulation: { status: 'error', entryPoint: 'simulation/index.html' },
    });
    // Technical detail stays server-side (spec §31).
    console.error(`[generation] session ${sessionId} failed:`, err);
  }
}

/**
 * Kick off background generation and return immediately (spec §36).
 * The returned status is the initial "generating" state.
 */
export function startGeneration(sessionId: string, brief: LearningBrief): GenerationStatus {
  setStep(sessionId, 'understanding');
  // Fire-and-forget; runGeneration owns its own error handling.
  void runGeneration(sessionId, brief);
  return statusStore.get(sessionId)!;
}
