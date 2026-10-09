import type { FastifyInstance } from 'fastify';
import { createSession, getSession, listSessions } from '../sessions/sessionManager';

/**
 * Session routes (spec §35). Phase 1 implements the create / list / get trio;
 * learning-brief, generate, status and simulation routes arrive in later phases.
 */
export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/sessions -> { sessionId }
  app.post('/api/sessions', async (_req, reply) => {
    const session = await createSession();
    return reply.code(201).send({ sessionId: session.id });
  });

  // GET /api/sessions -> history (newest first)
  app.get('/api/sessions', async () => {
    return listSessions();
  });

  // GET /api/sessions/:id -> session metadata
  app.get<{ Params: { id: string } }>('/api/sessions/:id', async (req, reply) => {
    const session = await getSession(req.params.id);
    if (!session) {
      return reply.code(404).send({ error: 'Session not found' });
    }
    return session;
  });
}
