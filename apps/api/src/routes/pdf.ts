import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@conversion-file/shared';
import { storageService } from '../storage';
import { enqueueJob } from '../queue';
import { validateMimetype, validateFileSize } from '../validators';
import { config } from '../config';
import { BadRequest } from '../errors';
import { fileTypeFromBuffer } from 'file-type';

const prisma = new PrismaClient();

export async function pdfRoutes(fastify: FastifyInstance) {
  // POST /api/pdf/merge - Merge múltiples PDFs
  fastify.post('/api/pdf/merge', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const files = request.files();
      const uploadedFiles: Array<{ buffer: Buffer; filename: string; mimetype: string }> = [];

      for await (const file of files) {
        const buffer = await file.toBuffer();
        validateFileSize(buffer.length, config.upload.maxFileSize);

        const fileTypeResult = await fileTypeFromBuffer(buffer);
        const mimeType = fileTypeResult?.mime || file.mimetype;

        validateMimetype('pdf-merge', mimeType);

        uploadedFiles.push({
          buffer,
          filename: file.filename,
          mimetype: mimeType,
        });
      }

      if (uploadedFiles.length < 2) {
        throw new BadRequest('At least 2 PDF files required for merge', 'INSUFFICIENT_FILES');
      }

      // Crear job
      const job = await prisma.job.create({
        data: {
          type: 'pdf-merge',
          status: 'QUEUED',
          inputPaths: [],
          originalName: uploadedFiles[0]?.filename || 'merged.pdf',
          mimeType: 'application/pdf',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Guardar archivos
      const inputPaths: string[] = [];
      for (const file of uploadedFiles) {
        const inputPath = await storageService.saveFile(file.buffer, file.filename, job.id);
        inputPaths.push(inputPath);
      }

      // Actualizar y encolar
      await prisma.job.update({
        where: { id: job.id },
        data: { inputPaths },
      });

      await enqueueJob({
        jobId: job.id,
        type: 'pdf-merge',
        inputPaths,
        originalName: 'merged.pdf',
        mimeType: 'application/pdf',
      });

      reply.status(201).send({
        jobId: job.id,
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

  // POST /api/pdf/split - Split PDF por página
  fastify.post('/api/pdf/split', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        throw new BadRequest('No file provided', 'NO_FILE');
      }

      const buffer = await data.toBuffer();
      validateFileSize(buffer.length, config.upload.maxFileSize);

      const fileTypeResult = await fileTypeFromBuffer(buffer);
      const mimeType = fileTypeResult?.mime || data.mimetype;

      validateMimetype('pdf-split', mimeType);

      // Crear job
      const job = await prisma.job.create({
        data: {
          type: 'pdf-split',
          status: 'QUEUED',
          inputPaths: [],
          originalName: data.filename,
          mimeType: 'application/pdf',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Guardar archivo
      const inputPath = await storageService.saveFile(buffer, data.filename, job.id);

      // Actualizar y encolar
      await prisma.job.update({
        where: { id: job.id },
        data: { inputPaths: [inputPath] },
      });

      await enqueueJob({
        jobId: job.id,
        type: 'pdf-split',
        inputPaths: [inputPath],
        originalName: data.filename,
        mimeType: 'application/pdf',
      });

      reply.status(201).send({
        jobId: job.id,
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

  // POST /api/pdf/compress - Compress PDF
  fastify.post('/api/pdf/compress', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = await request.file();

      if (!data) {
        throw new BadRequest('No file provided', 'NO_FILE');
      }

      const buffer = await data.toBuffer();
      validateFileSize(buffer.length, config.upload.maxFileSize);

      const fileTypeResult = await fileTypeFromBuffer(buffer);
      const mimeType = fileTypeResult?.mime || data.mimetype;

      validateMimetype('pdf-compress', mimeType);

      // Crear job
      const job = await prisma.job.create({
        data: {
          type: 'pdf-compress',
          status: 'QUEUED',
          inputPaths: [],
          originalName: data.filename,
          mimeType: 'application/pdf',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        },
      });

      // Guardar archivo
      const inputPath = await storageService.saveFile(buffer, data.filename, job.id);

      // Actualizar y encolar
      await prisma.job.update({
        where: { id: job.id },
        data: { inputPaths: [inputPath] },
      });

      await enqueueJob({
        jobId: job.id,
        type: 'pdf-compress',
        inputPaths: [inputPath],
        originalName: data.filename,
        mimeType: 'application/pdf',
      });

      reply.status(201).send({
        jobId: job.id,
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
}
