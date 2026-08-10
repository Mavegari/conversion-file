import Fastify from 'fastify';

const fastify = Fastify({
  logger: true,
});

fastify.get('/health', async (_request, _reply) => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    fastify.log.info('API server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();