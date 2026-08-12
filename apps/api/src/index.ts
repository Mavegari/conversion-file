import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import { config } from './config';
import { initQueue } from './queue';
import { jobsRoutes } from './routes/jobs';
import { setupBullBoard } from './bullboard';

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

    // Inicializar cola
    const queue = initQueue();

    // Configurar Bull Board
    setupBullBoard(fastify, queue);

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    // Registrar rutas
    await fastify.register(jobsRoutes);

    await fastify.listen({ port: config.api.port, host: config.api.host });
    fastify.log.info(`API server running on http://${config.api.host}:${config.api.port}`);
    fastify.log.info(
      `Bull Board available at http://${config.api.host}:${config.api.port}/admin/queues`
    );
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
