import type { FastifyInstance } from 'fastify';
import { AccessToken } from 'livekit-server-sdk';
import { getSession } from '../sessions/sessionManager';

/**
 * LiveKit token endpoint (spec §51). The API secret never leaves the backend;
 * the browser receives only a short-lived room token. The room name is the
 * session id, so the voice worker can tie a conversation to a session.
 */
export async function livekitRoutes(app: FastifyInstance): Promise<void> {
  app.post<{ Params: { id: string } }>('/api/sessions/:id/livekit-token', async (req, reply) => {
    const session = await getSession(req.params.id);
    if (!session) return reply.code(404).send({ error: 'Session not found' });

    const url = process.env.LIVEKIT_URL;
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!url || !apiKey || !apiSecret) {
      return reply.code(503).send({ error: 'Voice is not configured on this server' });
    }

    const room = req.params.id;
    const identity = `student-${req.params.id}`;
    const at = new AccessToken(apiKey, apiSecret, { identity, ttl: '15m' });
    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

    const token = await at.toJwt();
    return { token, url, room, identity };
  });
}
