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
      const type = (request.query as any).type as string;
      if (!type) {
        throw new BadRequest('Missing query parameter: type', 'MISSING_TYPE');
      }

      validateJobType(type);

      // Capturar múltiples archivos
      const files = request.files();
      const uploadedFiles: Array<{ buffer: Buffer; filename: string; mimetype: string }> = [];

      for await (const file of files) {
        const buffer = await file.toBuffer();
        validateFileSize(buffer.length, config.upload.maxFileSize);

        const fileTypeResult = await fileTypeFromBuffer(buffer);
        const mimeType = fileTypeResult?.mime || file.mimetype;

        validateMimetype(type, mimeType);

        uploadedFiles.push({
          buffer,
          filename: file.filename,
          mimetype: mimeType,
        });
      }

      if (uploadedFiles.length === 0) {
        throw new BadRequest('No files provided', 'NO_FILE');
      }

      // Crear registro en BD
      const job = await prisma.job.create({
        data: {
          type,
          status: 'QUEUED',
          inputPaths: [],
          originalName: uploadedFiles[0]?.filename || 'unknown',
          mimeType: uploadedFiles[0]?.mimetype || 'application/octet-stream',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Guardar todos los archivos en storage
      const inputPaths: string[] = [];
      for (const file of uploadedFiles) {
        const inputPath = await storageService.saveFile(file.buffer, file.filename, job.id);
        inputPaths.push(inputPath);
      }

      // Actualizar inputPaths
      await prisma.job.update({
        where: { id: job.id },
        data: {
          inputPaths,
        },
      });

      // Encolar en BullMQ
      await enqueueJob({
        jobId: job.id,
        type,
        inputPaths,
        originalName: uploadedFiles[0]?.filename || 'unknown',
        mimeType: uploadedFiles[0]?.mimetype || 'application/octet-stream',
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
