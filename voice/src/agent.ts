import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';
import {
  type JobContext,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
  llm,
} from '@livekit/agents';
import * as openai from '@livekit/agents-plugin-openai';

// Load the repo-root .env (two levels up from voice/src).
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(here, '../../.env') });

const BACKEND_URL = process.env.BACKEND_URL ?? 'http://127.0.0.1:3001';
const REALTIME_MODEL = process.env.OPENAI_REALTIME_MODEL ?? 'gpt-realtime';

const DISCOVERY_INSTRUCTIONS = `You are a friendly AI tutor doing a SHORT discovery conversation (about 2 minutes).

Your ONLY goal is to understand the student's learning need — you do NOT teach the
topic and you do NOT write code. Find out:
- the subject and the specific topic
- the student's level (beginner / intermediate / advanced)
- what they already understand
- the specific thing that confuses them
- what learning outcome they want
- whether they prefer to SEE something move/interact vs. work through equations

Guidelines:
- Keep turns short and conversational. Ask one focused question at a time.
- As soon as you have enough to describe an interactive demonstration, wrap up.
- If the student rambles, gently steer back toward their core confusion.
- When you have enough information, tell the student you'll build an interactive
  demonstration, then CALL the submit_learning_brief tool with the structured brief.
- Call submit_learning_brief exactly once, at the end.`;

async function postBrief(sessionId: string, brief: unknown): Promise<void> {
  const base = `${BACKEND_URL}/api/sessions/${sessionId}`;
  const res = await fetch(`${base}/learning-brief`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(brief),
  });
  if (!res.ok) throw new Error(`learning-brief failed: ${res.status}`);
  const gen = await fetch(`${base}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  if (!gen.ok) throw new Error(`generate failed: ${gen.status}`);
}

export default defineAgent({
  entry: async (ctx: JobContext) => {
    await ctx.connect();
    // The backend sets the room name to the session id.
    const sessionId = ctx.room.name ?? '';

    const submitLearningBrief = llm.tool({
      description:
        'Submit the structured Learning Brief once you understand the student\'s need. ' +
        'Call this exactly once at the end of the conversation.',
      parameters: z.object({
        subject: z.string(),
        topic: z.string(),
        studentLevel: z.enum(['beginner', 'intermediate', 'advanced']),
        studentAlreadyUnderstands: z.array(z.string()).optional(),
        confusion: z.string(),
        learningGoal: z.string(),
        preferredDemonstration: z.string().optional(),
        requiredInteractions: z.array(z.string()).optional(),
      }),
      execute: async (brief) => {
        try {
          await postBrief(sessionId, brief);
          return 'Learning brief submitted. The interactive demonstration is being built now.';
        } catch (e) {
          return `Failed to submit the brief: ${e instanceof Error ? e.message : String(e)}`;
        }
      },
    });

    const agent = new voice.Agent({
      instructions: DISCOVERY_INSTRUCTIONS,
      tools: { submit_learning_brief: submitLearningBrief },
    });

    const session = new voice.AgentSession({
      llm: new openai.realtime.RealtimeModel({ model: REALTIME_MODEL, voice: 'alloy' }),
    });

    await session.start({ agent, room: ctx.room });

    // Open the conversation.
    session.generateReply({
      instructions: "Greet the student warmly and ask what they're struggling to understand.",
    });
  },
});

cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
