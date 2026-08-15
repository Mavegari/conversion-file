import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import { Converter, ConverterContext } from './index';

export class CsvToJsonConverter implements Converter {
  async handle(context: ConverterContext): Promise<string> {
    const { jobId, inputPaths, logger, job } = context;

    logger.info(`[${jobId}] Starting csv-to-json conversion`);

    if (!inputPaths || inputPaths.length === 0) {
      throw new Error('No input CSV file provided');
    }

    try {
      const storagePath = process.env.STORAGE_PATH || './storage';
      const inputPath = inputPaths[0] as string;
      const fullPath = path.join(storagePath, inputPath);

      // Paso 1: Leer archivo CSV (20%)
      await job.updateProgress(10);
      logger.info(`[${jobId}] Reading CSV file`);

      const csvContent = await fs.readFile(fullPath, 'utf-8');

      // Paso 2: Parsear CSV con PapaParse (40%)
      await job.updateProgress(30);
      logger.info(`[${jobId}] Parsing CSV`);

      const parsedData = await new Promise<any>((resolve, reject) => {
        Papa.parse(csvContent, {
          header: true,
          skipEmptyLines: true,
          complete: (results: any) => resolve(results),
          error: (error: any) => reject(error),
        });
      });

      if (!parsedData.data || parsedData.data.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      const rows = parsedData.data as any[];
      const headers = Object.keys((rows[0] as any) || {});

      logger.info(`[${jobId}] Parsed CSV: ${rows.length} rows, ${headers.length} columns`);

      // Paso 3: Crear estructura JSON (50%)
      await job.updateProgress(60);
      logger.info(`[${jobId}] Creating JSON structure`);

      const jsonOutput = {
        metadata: {
          source: 'csv-to-json',
          timestamp: new Date().toISOString(),
          rowCount: rows.length,
          columnCount: headers.length,
          columns: headers,
        },
        data: rows,
      };

      // Paso 4: Guardar JSON (10%)
      await job.updateProgress(90);
      logger.info(`[${jobId}] Saving JSON file`);

      const outputFilename = `${jobId}_output.json`;
      const outputPath = path.join(storagePath, outputFilename);

      await fs.writeFile(outputPath, JSON.stringify(jsonOutput, null, 2));

      await job.updateProgress(100);
      logger.info(`[${jobId}] Conversion complete: ${outputFilename} (${rows.length} rows)`);

      return outputFilename;
    } catch (error) {
      logger.error(`[${jobId}] Conversion failed: ${error}`);
      throw error;
    }
  }
}
