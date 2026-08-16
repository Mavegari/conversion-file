import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';
import { Converter, ConverterContext } from './index';

const execFileAsync = promisify(execFile);

export class OfficeToPdfConverter implements Converter {
  async handle(context: ConverterContext): Promise<string> {
    const { jobId, inputPaths, logger, job } = context;

    logger.info(`[${jobId}] Starting office-to-pdf conversion`);

    if (!inputPaths || inputPaths.length === 0) {
      throw new Error('No input Office file provided');
    }

    try {
      const storagePath = process.env.STORAGE_PATH || './storage';
      const inputPath = inputPaths[0] as string;
      const fullPath = path.join(storagePath, inputPath);

      // Paso 1: Validar archivo (10%)
      await job.updateProgress(10);
      logger.info(`[${jobId}] Validating Office file`);

      const stats = await fs.stat(fullPath);
      const fileSizeMB = stats.size / (1024 * 1024);
      logger.info(`[${jobId}] File size: ${fileSizeMB.toFixed(2)} MB`);

      // Paso 2: Invocar LibreOffice (70%)
      await job.updateProgress(20);
      logger.info(`[${jobId}] Invoking LibreOffice headless`);

      try {
        // Detectar ruta de soffice según OS
        const sofficeCmd =
          process.platform === 'win32'
            ? 'C:\\Program Files\\LibreOffice\\program\\soffice.exe'
            : 'soffice';

        // Ejecutar LibreOffice con timeout de 60 segundos
        const { stdout, stderr } = await execFileAsync(
          sofficeCmd,
          ['--headless', '--convert-to', 'pdf', '--outdir', storagePath, fullPath],
          {
            timeout: 60000, // 60 segundos timeout
            maxBuffer: 10 * 1024 * 1024, // 10 MB buffer
          }
        );

        // Actualizar progreso durante conversión (simulado)
        await job.updateProgress(50);
        logger.info(`[${jobId}] LibreOffice conversion in progress`);
        await job.updateProgress(70);

        // Log de salida
        if (stdout) logger.info(`[${jobId}] LibreOffice stdout: ${stdout}`);
        if (stderr) logger.info(`[${jobId}] LibreOffice stderr: ${stderr}`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(`[${jobId}] LibreOffice error: ${errorMsg}`);
        throw new Error(`LibreOffice conversion failed: ${errorMsg}`);
      }

      // Paso 3: Localizar archivo PDF generado (15%)
      await job.updateProgress(80);
      logger.info(`[${jobId}] Locating generated PDF`);

      // LibreOffice genera PDF con el mismo nombre pero extensión .pdf
      const baseFileName = path.basename(fullPath);
      const pdfFileName = baseFileName.replace(/\.[^.]+$/, '.pdf');
      const pdfPath = path.join(storagePath, pdfFileName);

      // Verificar que el PDF existe
      try {
        await fs.stat(pdfPath);
        logger.info(`[${jobId}] PDF found: ${pdfFileName}`);
      } catch {
        throw new Error(`Generated PDF not found at ${pdfPath}`);
      }

      // Paso 4: Renombrar a formato consistente (5%)
      await job.updateProgress(90);
      logger.info(`[${jobId}] Finalizing PDF`);

      const outputFilename = `${jobId}_output.pdf`;
      const finalPath = path.join(storagePath, outputFilename);

      // Si el nombre es diferente, renombrar
      if (pdfPath !== finalPath) {
        await fs.rename(pdfPath, finalPath);
        logger.info(`[${jobId}] Renamed: ${pdfFileName} → ${outputFilename}`);
      }

      const pdfStats = await fs.stat(finalPath);
      const pdfSizeMB = pdfStats.size / (1024 * 1024);

      await job.updateProgress(100);
      logger.info(`[${jobId}] Conversion complete: ${outputFilename} (${pdfSizeMB.toFixed(2)} MB)`);

      return outputFilename;
    } catch (error) {
      logger.error(`[${jobId}] Conversion failed: ${error}`);
      throw error;
    }
  }
}
