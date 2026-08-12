import { Queue } from 'bullmq';
import { config } from './config';

export interface JobData {
  jobId: string;
  type: string;
  inputPaths: string[];
  originalName: string;
  mimeType: string;
}

let conversionQueue: Queue | null = null;

export function initQueue(): Queue {
  if (!conversionQueue) {
    conversionQueue = new Queue('conversions', {
      connection: {
        host: config.redis.host,
        port: config.redis.port,
      },
    });
  }
  return conversionQueue;
}

export async function enqueueJob(data: JobData): Promise<string> {
  const queue = initQueue();
  const job = await queue.add('convert', data, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });
  return job.id!;
}

export function getQueue(): Queue {
  if (!conversionQueue) {
    throw new Error('Queue not initialized');
  }
  return conversionQueue;
}
