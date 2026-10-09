import type { FastifyInstance } from 'fastify';
import { getSession, updateSession } from '../sessions/sessionManager';
import { saveLearningBrief, getLearningBrief } from '../sessions/brief';
import { startGeneration, getGenerationStatus } from '../services/generationService';
import type { LearningBrief } from '../types';

/**
 * Learning-brief + generation + status + simulation routes (spec §35–37).
 */
export async function generationRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/sessions/:id/learning-brief — store/update the brief (spec §35).
  app.post<{ Params: { id: string }; Body: LearningBrief }>(
    '/api/sessions/:id/learning-brief',
    async (req, reply) => {
      const session = await getSession(req.params.id);
      if (!session) return reply.code(404).send({ error: 'Session not found' });

      const brief = req.body;
      if (!brief || typeof brief.subject !== 'string' || typeof brief.topic !== 'string') {
        return reply.code(400).send({ error: 'Invalid learning brief: subject and topic are required' });
      }

      await saveLearningBrief(req.params.id, brief);
      await updateSession(req.params.id, {
        status: 'understanding',
        subject: brief.subject,
        topic: brief.topic,
      });
      return { ok: true };
    },
  );

  // POST /api/sessions/:id/generate — start async generation, return 202 (spec §36).
  app.post<{ Params: { id: string }; Body?: { brief?: LearningBrief } }>(
    '/api/sessions/:id/generate',
    async (req, reply) => {
      const session = await getSession(req.params.id);
      if (!session) return reply.code(404).send({ error: 'Session not found' });

      // Prefer a brief in the body; otherwise use the stored one.
      const brief = req.body?.brief ?? (await getLearningBrief(req.params.id));
      if (!brief) {
        return reply.code(400).send({ error: 'No learning brief available for this session' });
      }
      if (req.body?.brief) await saveLearningBrief(req.params.id, brief);

      const status = startGeneration(req.params.id, brief);
      return reply.code(202).send(status);
    },
  );

  // GET /api/sessions/:id/status — generation progress for polling (spec §37).
  app.get<{ Params: { id: string } }>('/api/sessions/:id/status', async (req, reply) => {
    const status = await getGenerationStatus(req.params.id);
    if (!status) {
      const session = await getSession(req.params.id);
      if (!session) return reply.code(404).send({ error: 'Session not found' });
      // Session exists but generation has not started yet.
      return { status: 'generating', step: 'understanding', message: 'Starting…' };
    }
    return status;
  });

  // GET /api/sessions/:id/simulation — simulation metadata (spec §35).
  app.get<{ Params: { id: string } }>('/api/sessions/:id/simulation', async (req, reply) => {
    const session = await getSession(req.params.id);
    if (!session) return reply.code(404).send({ error: 'Session not found' });
    const ready = session.simulation.status === 'ready';
    return {
      ready,
      url: ready ? `/simulations/${req.params.id}/` : null,
    };
  });
}
