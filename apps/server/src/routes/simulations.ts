import fs from 'node:fs/promises';
import path from 'node:path';
import type { FastifyInstance } from 'fastify';
import { resolveSafePath, PathSecurityError } from '../artifacts/pathGuard';

/**
 * Static simulation server (spec §23–24). Serves only files inside
 * sessions/<id>/simulation/, through the same path guard the agent uses.
 * The real filesystem path is never exposed to the client.
 */

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function contentType(filePath: string): string {
  return CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream';
}

export async function simulationRoutes(app: FastifyInstance): Promise<void> {
  // Normalise the bare session URL to a trailing slash so relative asset
  // references (style.css, app.js) resolve correctly in the iframe.
  app.get<{ Params: { id: string } }>('/simulations/:id', async (req, reply) => {
    return reply.redirect(`/simulations/${req.params.id}/`, 301);
  });

  app.get<{ Params: { id: string; '*': string } }>('/simulations/:id/*', async (req, reply) => {
    const rel = req.params['*']?.length ? req.params['*'] : 'index.html';

    let full: string;
    try {
      full = resolveSafePath(req.params.id, rel);
    } catch (e) {
      if (e instanceof PathSecurityError) return reply.code(404).send({ error: 'Not found' });
      throw e;
    }

    let data: Buffer;
    try {
      data = await fs.readFile(full);
    } catch {
      return reply.code(404).send({ error: 'Not found' });
    }

    return reply
      .header('Content-Type', contentType(full))
      // Generated code is untrusted; keep it out of caches during the demo.
      .header('Cache-Control', 'no-store')
      .send(data);
  });
}
