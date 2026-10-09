import Fastify from 'fastify';
import cors from '@fastify/cors';
import { sessionRoutes } from './routes/sessions';
import { generationRoutes } from './routes/generation';
import { simulationRoutes } from './routes/simulations';
import { livekitRoutes } from './routes/livekit';

export async function buildServer() {
  const app = Fastify({ logger: { level: 'info' }, bodyLimit: 5 * 1024 * 1024 });

  // Frontend (Vite dev server) calls the API cross-origin during development.
  await app.register(cors, { origin: true });

  app.get('/health', async () => ({ ok: true }));

  // Lets the frontend know whether the voice feature is available (spec §31).
  app.get('/api/config', async () => ({
    voiceEnabled: Boolean(
      process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET,
    ),
  }));

  await app.register(sessionRoutes);
  await app.register(generationRoutes);
  await app.register(simulationRoutes);
  await app.register(livekitRoutes);

  return app;
}
