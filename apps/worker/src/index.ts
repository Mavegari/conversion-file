import { Worker } from 'bullmq';
import { PrismaClient, JOB_STATUS } from '@conversion-file/shared';
import pino from 'pino';
import { config } from './config';
import { registerConverter, processJob } from './converters';
import { DummyConverter } from './converters/dummy';
import { ImagesToPdfConverter } from './converters/images-to-pdf';
import { CsvToXlsxConverter } from './converters/csv-to-xlsx';
import { CsvToJsonConverter } from './converters/csv-to-json';

const logger = pino();
const prisma = new PrismaClient();

// Registrar convertores
const dummyConverter = new DummyConverter();
const imagesToPdfConverter = new ImagesToPdfConverter();
const csvToXlsxConverter = new CsvToXlsxConverter();
const csvToJsonConverter = new CsvToJsonConverter();

registerConverter('images-to-pdf', imagesToPdfConverter);
registerConverter('csv-to-xlsx', csvToXlsxConverter);
registerConverter('csv-to-json', csvToJsonConverter);
registerConverter('office-to-pdf', dummyConverter);
registerConverter('pdf-merge', dummyConverter);
registerConverter('pdf-split', dummyConverter);
registerConverter('pdf-compress', dummyConverter);

async function startWorker() {
  try {
    logger.info('🚀 Worker starting...');

    // Crear worker
    const worker = new Worker(
      'conversions',
      async (job) => {
        const jobId = job.data.jobId as string;
        const { type, inputPaths } = job.data;

        logger.info(`[${jobId}] Processing job: ${type}`);

        try {
          // Actualizar status a PROCESSING
          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: JOB_STATUS.PROCESSING,
              progress: 0,
            },
          });

          // Procesar el job
          const outputPath = await processJob(job, type, inputPaths, prisma, logger);

          // Calcular expiración (24 horas desde ahora)
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

          // Actualizar status a COMPLETED
          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: JOB_STATUS.COMPLETED,
              progress: 100,
              outputPath,
              expiresAt,
            },
          });

          logger.info(`[${jobId}] Job completed successfully`);
        } catch (error) {
          logger.error(`[${jobId}] Job failed: ${error}`);

          // Actualizar status a FAILED
          await prisma.job.update({
            where: { id: jobId },
            data: {
              status: JOB_STATUS.FAILED,
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
          });

          throw error; // Re-lanzar para que BullMQ maneje los reintentos
        }
      },
      {
        connection: {
          host: config.redis.host,
          port: config.redis.port,
        },
        concurrency: config.worker.concurrency,
      }
    );

    // Event listeners
    worker.on('completed', (job) => {
      logger.info(`[${job.id}] ✅ Job completed`);
    });

    worker.on('failed', (job, err) => {
      logger.error(`[${job?.id}] ❌ Job failed after retries: ${err.message}`);
    });

    worker.on('error', (error) => {
      logger.error(`Worker error: ${error.message}`);
    });

    logger.info('✅ Worker listening for jobs...');
  } catch (error) {
    logger.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

startWorker();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});
