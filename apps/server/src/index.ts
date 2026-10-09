import { buildServer } from './server';
import { config } from './config';

const app = await buildServer();

try {
  await app.listen({ port: config.port, host: '0.0.0.0' });
  app.log.info(`Sessions stored in: ${config.sessionsDir}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
