import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import { config } from './config';
import { jobsRoutes } from './routes/jobs';

const fastify = Fastify({
  logger: true,
});

async function start() {
  try {
    // Registrar plugins
    await fastify.register(fastifyHelmet);
    await fastify.register(fastifyCors, {
      origin: true,
    });
    await fastify.register(fastifyMultipart, {
      limits: {
        fileSize: config.upload.maxFileSize,
      },
    });
    await fastify.register(fastifyRateLimit, {
      max: 100,
      timeWindow: '15 minutes',
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    // Registrar rutas
    await fastify.register(jobsRoutes);

    await fastify.listen({ port: config.api.port, host: config.api.host });
    fastify.log.info(`API server running on http://${config.api.host}:${config.api.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
