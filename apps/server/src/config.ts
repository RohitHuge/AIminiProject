import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

// Load .env from the repo root (../../../.env relative to this file).
const here = path.dirname(fileURLToPath(import.meta.url)); // apps/server/src
const repoRoot = path.resolve(here, '../../..');

dotenv.config({ path: path.join(repoRoot, '.env') });

export const config = {
  repoRoot,
  port: Number(process.env.PORT ?? 3001),
  /**
   * Root directory holding all session folders.
   * Every session lives at <sessionsDir>/<sessionId>/.
   */
  sessionsDir: process.env.SESSIONS_DIR
    ? path.resolve(process.env.SESSIONS_DIR)
    : path.join(repoRoot, 'sessions'),
} as const;
