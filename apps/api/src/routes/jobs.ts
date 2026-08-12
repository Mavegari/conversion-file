import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@conversion-file/shared';
import { storageService } from '../storage';
import { enqueueJob } from '../queue';
import { validateJobType, validateMimetype, validateFileSize } from '../validators';
import { config } from '../config';
import { BadRequest, NotFound, InternalServerError } from '../errors';
import { fileTypeFromBuffer } from 'file-type';

const prisma = new PrismaClient();

export async function jobsRoutes(fastify: FastifyInstance) {
  // POST /api/jobs - Crear un nuevo job
  fastify.post('/api/jobs', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        throw new BadRequest('No file provided', 'NO_FILE');
      }

      const type = (request.query as any).type as string;
      if (!type) {
        throw new BadRequest('Missing query parameter: type', 'MISSING_TYPE');
      }

      validateJobType(type);

      const buffer = await data.toBuffer();

      // Validar tamaño
      validateFileSize(buffer.length, config.upload.maxFileSize);

      // Detectar mimetype real con file-type
      const fileTypeResult = await fileTypeFromBuffer(buffer);
      const mimeType = fileTypeResult?.mime || data.mimetype;

      // Validar mimetype
      validateMimetype(type, mimeType);

      // Crear registro en BD
      const job = await prisma.job.create({
        data: {
          type,
          status: 'QUEUED',
          inputPaths: [],
          originalName: data.filename,
          mimeType,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Guardar archivo en storage
      const inputPath = await storageService.saveFile(buffer, data.filename, job.id);

      // Actualizar inputPaths
      await prisma.job.update({
        where: { id: job.id },
        data: {
          inputPaths: [inputPath],
        },
      });

      // Encolar en BullMQ
      await enqueueJob({
        jobId: job.id,
        type,
        inputPaths: [inputPath],
        originalName: data.filename,
        mimeType,
      });

      reply.status(201).send({
        id: job.id,
        status: job.status,
        progress: job.progress,
      });
    } catch (error) {
      if (error instanceof BadRequest) {
        reply.status(error.statusCode).send({
          error: error.code,
          message: error.message,
        });
      } else {
        fastify.log.error(error);
        reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }
  });

  // GET /api/jobs/:id - Obtener estado de un job
  fastify.get('/api/jobs/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const job = await prisma.job.findUnique({
        where: { id },
      });

      if (!job) {
        throw new NotFound(`Job not found: ${id}`, 'JOB_NOT_FOUND');
      }

      reply.send({
        id: job.id,
        type: job.type,
        status: job.status,
        progress: job.progress,
        errorMessage: job.errorMessage,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
      });
    } catch (error) {
      if (error instanceof NotFound) {
        reply.status(error.statusCode).send({
          error: error.code,
          message: error.message,
        });
      } else {
        fastify.log.error(error);
        reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }
  });

  // GET /api/jobs/:id/download - Descargar resultado
  fastify.get('/api/jobs/:id/download', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { id } = request.params as { id: string };

      const job = await prisma.job.findUnique({
        where: { id },
      });

      if (!job) {
        throw new NotFound(`Job not found: ${id}`, 'JOB_NOT_FOUND');
      }

      if (job.status !== 'COMPLETED') {
        throw new BadRequest(
          `Job is not completed. Current status: ${job.status}`,
          'JOB_NOT_READY'
        );
      }

      if (!job.outputPath) {
        throw new InternalServerError('Output path not found', 'MISSING_OUTPUT_PATH');
      }

      const file = await storageService.getFile(job.outputPath);
      reply.type(job.mimeType).send(file);
    } catch (error) {
      if (error instanceof BadRequest || error instanceof NotFound) {
        reply.status((error as any).statusCode).send({
          error: (error as any).code,
          message: (error as any).message,
        });
      } else {
        fastify.log.error(error);
        reply.status(500).send({
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }
    }
  });
}
