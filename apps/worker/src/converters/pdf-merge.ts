import { PDFDocument } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { Converter, ConverterContext } from './index';

export class PdfMergeConverter implements Converter {
  async handle(context: ConverterContext): Promise<string> {
    const { jobId, inputPaths, logger, job } = context;

    logger.info(`[${jobId}] Starting pdf-merge conversion`);

    if (!inputPaths || inputPaths.length < 2) {
      throw new Error('At least 2 PDF files required for merge');
    }

    try {
      const storagePath = process.env.STORAGE_PATH || './storage';

      // Paso 1: Leer y validar PDFs (20%)
      await job.updateProgress(10);
      logger.info(`[${jobId}] Loading ${inputPaths.length} PDF files`);

      const pdfDocs: PDFDocument[] = [];

      for (let i = 0; i < inputPaths.length; i += 1) {
        const inputPath = inputPaths[i] as string;
        const fullPath = path.join(storagePath, inputPath);

        const pdfBuffer = await fs.readFile(fullPath);
        const pdfDoc = await PDFDocument.load(pdfBuffer);
        pdfDocs.push(pdfDoc);

        const progress = 10 + (i / inputPaths.length) * 40;
        await job.updateProgress(Math.floor(progress));

        logger.info(`[${jobId}] Loaded PDF ${i + 1}/${inputPaths.length}`);
      }

      // Paso 2: Crear documento destino (10%)
      await job.updateProgress(50);
      logger.info(`[${jobId}] Creating merged PDF document`);

      const mergedPdf = await PDFDocument.create();

      // Paso 3: Copiar páginas (60%)
      await job.updateProgress(55);
      logger.info(`[${jobId}] Copying pages from all PDFs`);

      for (let i = 0; i < pdfDocs.length; i += 1) {
        const sourceDoc = pdfDocs[i] as PDFDocument;
        const pageIndices = sourceDoc.getPageIndices();

        for (let j = 0; j < pageIndices.length; j += 1) {
          const pageIndex = pageIndices[j] as number;
          const copiedPage = await mergedPdf.copyPages(sourceDoc, [pageIndex]);
          mergedPdf.addPage(copiedPage[0]);
        }

        const progress = 55 + (i / pdfDocs.length) * 35;
        await job.updateProgress(Math.floor(progress));

        logger.info(`[${jobId}] Copied pages from PDF ${i + 1}/${pdfDocs.length}`);
      }

      // Paso 4: Guardar documento (10%)
      await job.updateProgress(90);
      logger.info(`[${jobId}] Saving merged PDF`);

      const pdfBytes = await mergedPdf.save();

      const outputFilename = `${jobId}_output.pdf`;
      const outputPath = path.join(storagePath, outputFilename);

      await fs.writeFile(outputPath, pdfBytes);

      const totalPages = mergedPdf.getPageCount();
      await job.updateProgress(100);
      logger.info(
        `[${jobId}] Merge complete: ${outputFilename} (${totalPages} pages, ${(pdfBytes.length / 1024).toFixed(2)} KB)`
      );

      return outputFilename;
    } catch (error) {
      logger.error(`[${jobId}] Conversion failed: ${error}`);
      throw error;
    }
  }
}
