import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { Converter, ConverterContext } from './index';

export class PdfSplitConverter implements Converter {
  async handle(context: ConverterContext): Promise<string> {
    const { jobId, inputPaths, logger, job } = context;

    logger.info(`[${jobId}] Starting pdf-split conversion`);

    if (!inputPaths || inputPaths.length === 0) {
      throw new Error('No input PDF file provided');
    }

    try {
      const storagePath = process.env.STORAGE_PATH || './storage';
      const inputPath = inputPaths[0] as string;
      const fullPath = path.join(storagePath, inputPath);

      // Paso 1: Leer PDF (20%)
      await job.updateProgress(10);
      logger.info(`[${jobId}] Reading PDF file`);

      const pdfBuffer = await fs.readFile(fullPath);
      const sourcePdf = await PDFDocument.load(pdfBuffer);
      const pageCount = sourcePdf.getPageCount();

      logger.info(`[${jobId}] PDF has ${pageCount} pages`);

      if (pageCount < 2) {
        throw new Error('PDF must have at least 2 pages to split');
      }

      // Paso 2: Crear documento por cada página (70%)
      await job.updateProgress(30);
      logger.info(`[${jobId}] Splitting PDF into individual pages`);

      const outputFilenames: string[] = [];

      for (let i = 0; i < pageCount; i += 1) {
        const newPdf = await PDFDocument.create();
        const copiedPage = await newPdf.copyPages(sourcePdf, [i]);
        newPdf.addPage(copiedPage[0]);

        const pdfBytes = await newPdf.save();

        const pageNumber = i + 1;
        const outputFilename = `${jobId}_page_${pageNumber}.pdf`;
        const outputPath = path.join(storagePath, outputFilename);

        await fs.writeFile(outputPath, pdfBytes);
        outputFilenames.push(outputFilename);

        const progress = 30 + (i / pageCount) * 60;
        await job.updateProgress(Math.floor(progress));

        logger.info(`[${jobId}] Created page ${pageNumber}/${pageCount}`);
      }

      // Paso 3: Crear archivo índice (10%)
      await job.updateProgress(90);
      logger.info(`[${jobId}] Creating split index`);

      const indexData = {
        source: inputPath,
        totalPages: pageCount,
        splitFiles: outputFilenames,
        timestamp: new Date().toISOString(),
      };

      const indexPath = path.join(storagePath, `${jobId}_split_index.json`);
      await fs.writeFile(indexPath, JSON.stringify(indexData, null, 2));

      await job.updateProgress(100);
      logger.info(`[${jobId}] Split complete: ${pageCount} files created`);

      // Retornar el nombre del archivo índice
      return `${jobId}_split_index.json`;
    } catch (error) {
      logger.error(`[${jobId}] Conversion failed: ${error}`);
      throw error;
    }
  }
}
