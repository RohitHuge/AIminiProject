import { tool } from '@openai/agents';
import { z } from 'zod';
import * as files from '../artifacts/fileTools';

/**
 * Build the filesystem tools for a single generation run (spec §16).
 *
 * The session id is captured in the closure — it is NOT a tool parameter — so
 * the model can neither choose nor tamper with which session it writes to.
 * Every path still passes through the Phase-2 path guard inside fileTools.
 *
 * Tool errors (e.g. a rejected path) are returned as text rather than thrown,
 * so the agent can read the message and correct itself instead of aborting.
 */
export function buildFileTools(sessionId: string) {
  const asError = (e: unknown) => `ERROR: ${e instanceof Error ? e.message : String(e)}`;

  const listFiles = tool({
    name: 'list_files',
    description: 'List the simulation files that currently exist for this session.',
    parameters: z.object({}),
    execute: async () => {
      try {
        return JSON.stringify({ files: await files.listFiles(sessionId) });
      } catch (e) {
        return asError(e);
      }
    },
  });

  const readFile = tool({
    name: 'read_file',
    description: 'Read the UTF-8 text content of a simulation file (e.g. "app.js").',
    parameters: z.object({
      path: z.string().describe('Path relative to the simulation root, e.g. "index.html".'),
    }),
    execute: async ({ path }) => {
      try {
        return await files.readFile(sessionId, path);
      } catch (e) {
        return asError(e);
      }
    },
  });

  const writeFile = tool({
    name: 'write_file',
    description: 'Create or overwrite a simulation file with the given text content.',
    parameters: z.object({
      path: z.string().describe('Path relative to the simulation root, e.g. "style.css".'),
      content: z.string().describe('Full UTF-8 text content of the file.'),
    }),
    execute: async ({ path, content }) => {
      try {
        await files.writeFile(sessionId, path, content);
        return `Wrote ${path} (${Buffer.byteLength(content, 'utf8')} bytes).`;
      } catch (e) {
        return asError(e);
      }
    },
  });

  const updateFile = tool({
    name: 'update_file',
    description: 'Update a simulation file by overwriting it with new content.',
    parameters: z.object({
      path: z.string(),
      content: z.string(),
    }),
    execute: async ({ path, content }) => {
      try {
        await files.updateFile(sessionId, path, content);
        return `Updated ${path} (${Buffer.byteLength(content, 'utf8')} bytes).`;
      } catch (e) {
        return asError(e);
      }
    },
  });

  const deleteFile = tool({
    name: 'delete_file',
    description: 'Delete a simulation file.',
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      try {
        await files.deleteFile(sessionId, path);
        return `Deleted ${path}.`;
      } catch (e) {
        return asError(e);
      }
    },
  });

  return [listFiles, readFile, writeFile, updateFile, deleteFile];
}
