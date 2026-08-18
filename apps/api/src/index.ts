import Fastify from 'fastify';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyRateLimit from '@fastify/rate-limit';
import { createClient } from 'redis';
import { config } from './config';
import { initQueue } from './queue';
import { jobsRoutes } from './routes/jobs';
import { pdfRoutes } from './routes/pdf';
import { setupBullBoard } from './bullboard';
import { setupWebSocket, emitJobProgress } from './websocket';

const fastify = Fastify({
  logger: true,
});

async function start() {
  try {
    // 1. Registrar plugins en orden correcto
    await fastify.register(fastifyHelmet);
    await fastify.register(fastifyCors, {
      origin: true,
    });

    //  MULTIPART debe ir ANTES de usar request.files()
    await fastify.register(fastifyMultipart, {
      limits: {
        fileSize: config.upload.maxFileSize,
      },
    });

    await fastify.register(fastifyRateLimit, {
      max: 100,
      timeWindow: '15 minutes',
    });

    // 2. Inicializar cola
    const queue = initQueue();

    // 3. Configurar Bull Board
    setupBullBoard(fastify, queue);

    // 4. Health check
    fastify.get('/health', async () => {
      return { status: 'ok' };
    });

    // 5. Registrar rutas
    await fastify.register(jobsRoutes);
    await fastify.register(pdfRoutes);

    // 6. Setup WebSocket y Redis pub/sub
    const io = await setupWebSocket(fastify.server);

    // Suscribirse a eventos de progreso desde Redis
    const redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    });

    await redisClient.connect();

    const subscriber = redisClient.duplicate();
    await subscriber.connect();

    // Escuchar eventos de progreso
    await subscriber.subscribe('job:progress', (message) => {
      try {
        const data = JSON.parse(message);
        emitJobProgress(io, data.jobId, data.progress, data.status);
      } catch (error) {
        fastify.log.error(`Error parsing progress event: ${error}`);
      }
    });

    fastify.log.info('Subscribed to job:progress channel');

    // 7. Escuchar
    await fastify.listen({ port: config.api.port, host: config.api.host });
    fastify.log.info(`API server running on http://${config.api.host}:${config.api.port}`);
    fastify.log.info(
      `Bull Board available at http://${config.api.host}:${config.api.port}/admin/queues`
    );
    fastify.log.info(`WebSocket ready on ws://${config.api.host}:${config.api.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
