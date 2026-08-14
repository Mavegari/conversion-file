import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { Converter, ConverterContext } from './index';

export class ImagesToPdfConverter implements Converter {
  async handle(context: ConverterContext): Promise<string> {
    const { jobId, inputPaths, logger, job } = context;

    logger.info(`[${jobId}] Starting images-to-pdf conversion`);

    if (!inputPaths || inputPaths.length === 0) {
      throw new Error('No input images provided');
    }

    try {
      // Paso 1: Normalizar imágenes con Sharp (25%)
      await job.updateProgress(10);
      logger.info(`[${jobId}] Normalizing ${inputPaths.length} image(s)`);

      const normalizedImages: Buffer[] = [];
      const storagePath = process.env.STORAGE_PATH || './storage';

      for (let i = 0; i < inputPaths.length; i += 1) {
        const inputPath = inputPaths[i] as string;
        const fullPath = path.join(storagePath, inputPath);

        // Leer imagen original
        const imageBuffer = await fs.readFile(fullPath);

        // Normalizar con Sharp: convertir a PNG
        const normalized = await sharp(imageBuffer).png({ quality: 80 }).toBuffer();

        normalizedImages.push(normalized);

        // Actualizar progreso por imagen normalizada
        const normalizeProgress = 10 + (i / inputPaths.length) * 30;
        await job.updateProgress(Math.floor(normalizeProgress));

        logger.info(`[${jobId}] Normalized image ${i + 1}/${inputPaths.length}`);
      }

      // Paso 2: Crear PDF con pdf-lib (25%)
      await job.updateProgress(45);
      logger.info(`[${jobId}] Creating PDF document`);

      const pdfDoc = await PDFDocument.create();

      for (let i = 0; i < normalizedImages.length; i += 1) {
        const imageBuffer = normalizedImages[i] as Buffer;

        // Embeber imagen en PDF
        const embeddedImage = await pdfDoc.embedPng(imageBuffer);

        // Obtener dimensiones
        const { width, height } = embeddedImage;

        // Crear página con tamaño de la imagen
        const page = pdfDoc.addPage([width, height]);
        page.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width,
          height,
        });

        // Actualizar progreso
        const pdfProgress = 45 + (i / normalizedImages.length) * 40;
        await job.updateProgress(Math.floor(pdfProgress));

        logger.info(`[${jobId}] Added image ${i + 1}/${normalizedImages.length} to PDF`);
      }

      // Paso 3: Guardar PDF (10%)
      await job.updateProgress(90);
      logger.info(`[${jobId}] Saving PDF`);

      const pdfBytes = await pdfDoc.save();

      // Guardar en storage
      const outputFilename = `${jobId}_output.pdf`;
      const outputPath = path.join(storagePath, outputFilename);

      await fs.writeFile(outputPath, pdfBytes);

      await job.updateProgress(100);
      logger.info(
        `[${jobId}] PDF created successfully: ${outputFilename} (${pdfBytes.length} bytes)`
      );

      return outputFilename;
    } catch (error) {
      logger.error(`[${jobId}] Conversion failed: ${error}`);
      throw error;
    }
  }
}
