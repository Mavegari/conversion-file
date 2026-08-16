export const config = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  worker: {
    concurrency: 2, // Reducir de 4 a 2 para office-to-pdf (pesado)
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};
