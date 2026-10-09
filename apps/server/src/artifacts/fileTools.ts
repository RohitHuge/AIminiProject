import fs from 'node:fs/promises';
import path from 'node:path';
import { resolveSafePath, simulationRoot } from './pathGuard';

/**
 * Filesystem tools exposed to the generation agent (spec §16–17).
 * Every operation is confined to sessions/<sessionId>/simulation/ via the
 * path guard — the agent can never touch arbitrary filesystem paths.
 */

async function ensureSimulationRoot(sessionId: string): Promise<string> {
  const root = simulationRoot(sessionId);
  await fs.mkdir(root, { recursive: true });
  return root;
}

/** List the simulation files for a session (spec §17 list_files). */
export async function listFiles(sessionId: string): Promise<string[]> {
  const root = await ensureSimulationRoot(sessionId);
  const entries = await fs.readdir(root, { withFileTypes: true, recursive: true });
  return entries
    .filter((e) => e.isFile())
    .map((e) => {
      const full = path.join(e.parentPath ?? root, e.name);
      return path.relative(root, full).split(path.sep).join('/');
    })
    .sort();
}

/** Read a simulation file as UTF-8 text (spec §17 read_file). */
export async function readFile(sessionId: string, relPath: string): Promise<string> {
  const full = resolveSafePath(sessionId, relPath);
  return fs.readFile(full, 'utf8');
}

/** Create or overwrite a simulation file (spec §17 write_file). */
export async function writeFile(sessionId: string, relPath: string, content: string): Promise<void> {
  const full = resolveSafePath(sessionId, relPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, content, 'utf8');
}

/**
 * Update a simulation file. For MVP this simply overwrites (spec §601) — no
 * diff/patch logic.
 */
export async function updateFile(sessionId: string, relPath: string, content: string): Promise<void> {
  return writeFile(sessionId, relPath, content);
}

/** Delete a simulation file (spec §16 delete_file). */
export async function deleteFile(sessionId: string, relPath: string): Promise<void> {
  const full = resolveSafePath(sessionId, relPath);
  await fs.rm(full, { force: true });
}
