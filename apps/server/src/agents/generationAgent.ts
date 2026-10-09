import { Agent, run, setDefaultOpenAIKey } from '@openai/agents';
import { GENERATION_SYSTEM_PROMPT } from './systemPrompt';
import { buildFileTools } from './tools';
import type { LearningBrief } from '../types';

const MODEL = process.env.OPENAI_MODEL ?? 'gpt-4.1';

let keyConfigured = false;
function ensureKey(): void {
  if (keyConfigured) return;
  const key = process.env.OPENAI_API_KEY;
  if (key) setDefaultOpenAIKey(key);
  keyConfigured = true;
}

export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

function makeAgent(sessionId: string) {
  return new Agent({
    name: 'Educational Simulation Engineer',
    instructions: GENERATION_SYSTEM_PROMPT,
    model: MODEL,
    tools: buildFileTools(sessionId),
  });
}

function buildInput(brief: LearningBrief): string {
  return [
    'Build an interactive educational simulation for the following Learning Brief.',
    '',
    'Learning Brief:',
    '```json',
    JSON.stringify(brief, null, 2),
    '```',
    '',
    'Create index.html, style.css and app.js using the file tools, then inspect',
    'and fix them. Focus on an interactive demonstration that directly targets the',
    "student's confusion and learning goal.",
  ].join('\n');
}

function buildRepairInput(brief: LearningBrief, errors: string[]): string {
  return [
    'The simulation files you created did not pass validation.',
    'Use read_file to inspect the current files, then use write_file / update_file',
    'to fix EVERY issue listed below. Keep the simulation self-contained: no network',
    'calls (fetch/XMLHttpRequest/WebSocket), no eval/new Function, and no external',
    'scripts or stylesheets.',
    '',
    'Validation errors:',
    ...errors.map((e) => `- ${e}`),
    '',
    'Learning Brief (for context):',
    '```json',
    JSON.stringify(brief, null, 2),
    '```',
  ].join('\n');
}

/**
 * Run the generation agent for a session. Produces index.html / style.css /
 * app.js inside sessions/<sessionId>/simulation/ via the path-guarded tools.
 * Throws on model/transport failure or if max turns is exceeded.
 */
export async function generateSimulation(sessionId: string, brief: LearningBrief): Promise<string> {
  ensureKey();
  const result = await run(makeAgent(sessionId), buildInput(brief), { maxTurns: 24 });
  return result.finalOutput ?? '';
}

/**
 * Ask the agent to repair the current simulation given validation errors
 * (spec §40). The agent reads the existing files and fixes them in place.
 */
export async function repairSimulation(
  sessionId: string,
  brief: LearningBrief,
  errors: string[],
): Promise<string> {
  ensureKey();
  const result = await run(makeAgent(sessionId), buildRepairInput(brief, errors), { maxTurns: 24 });
  return result.finalOutput ?? '';
}
