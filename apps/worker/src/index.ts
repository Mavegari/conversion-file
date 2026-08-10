import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const redis = new IORedis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
});

const worker = new Worker(
  'conversions',
  async (job) => {
    console.log(`Processing job ${job.id}: ${job.data.type}`);
    // Placeholder: handlers irán aquí en Fase 4
    return { success: true };
  },
  { connection: redis }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log('Worker started, listening for jobs...');