import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import pino from 'pino';

const logger = pino();

export async function setupWebSocket(httpServer: HTTPServer) {
  // Crear clientes Redis para pub/sub
  const pubClient = createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    },
  });

  const subClient = pubClient.duplicate();

  await Promise.all([pubClient.connect(), subClient.connect()]);

  // Crear servidor Socket.IO
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Configurar Redis adapter para escalar a múltiples procesos
  io.adapter(createAdapter(pubClient, subClient));

  // Manejar conexiones
  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // El cliente se suscribe a actualizaciones de un job
    socket.on('subscribe:job', (jobId: string) => {
      socket.join(`job:${jobId}`);
      logger.info(`Client ${socket.id} subscribed to job:${jobId}`);
    });

    // El cliente se desuscribe
    socket.on('unsubscribe:job', (jobId: string) => {
      socket.leave(`job:${jobId}`);
      logger.info(`Client ${socket.id} unsubscribed from job:${jobId}`);
    });

    // Desconexión
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// Función helper para emitir eventos de progreso desde el worker o API
export async function emitJobProgress(
  io: SocketIOServer,
  jobId: string,
  progress: number,
  status: string
) {
  io.to(`job:${jobId}`).emit('job:progress', {
    jobId,
    progress,
    status,
    timestamp: Date.now(),
  });
}
