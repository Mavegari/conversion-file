import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { Queue } from 'bullmq';

export function setupBullBoard(fastify: any, queue: Queue): void {
  const serverAdapter = new FastifyAdapter();

  createBullBoard({
    queues: [new BullMQAdapter(queue) as any],
    serverAdapter,
  } as any);

  fastify.register(serverAdapter.registerPlugin(), {
    prefix: '/admin/queues',
  });
}
