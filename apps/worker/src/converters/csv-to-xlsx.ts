import fs from 'fs/promises';
import path from 'path';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { Converter, ConverterContext } from './index';

export class CsvToXlsxConverter implements Converter {
  async handle(context: ConverterContext): Promise<string> {
    const { jobId, inputPaths, logger, job } = context;

    logger.info(`[${jobId}] Starting csv-to-xlsx conversion`);

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

      // Paso 2: Parsear CSV con PapaParse (30%)
      await job.updateProgress(20);
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

      // Paso 3: Crear workbook XLSX (40%)
      await job.updateProgress(50);
      logger.info(`[${jobId}] Creating Excel workbook`);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Data');

      // Agregar headers
      worksheet.addRow(headers);

      // Formatear header (bold)
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern' as const,
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' },
      };

      // Agregar datos
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i] as any;
        const values = headers.map((header) => row[header] || '');
        worksheet.addRow(values);

        // Actualizar progreso
        const dataProgress = 50 + (i / rows.length) * 35;
        await job.updateProgress(Math.floor(dataProgress));
      }

      // Auto-ajustar ancho de columnas
      headers.forEach((header, index) => {
        const column = worksheet.getColumn(index + 1);
        column.width = Math.max(12, header.length + 2);
      });

      // Paso 4: Guardar XLSX (10%)
      await job.updateProgress(85);
      logger.info(`[${jobId}] Saving Excel file`);

      const outputFilename = `${jobId}_output.xlsx`;
      const outputPath = path.join(storagePath, outputFilename);

      await workbook.xlsx.writeFile(outputPath);

      // Paso 5: Generar JSON alternativo (5%)
      await job.updateProgress(95);
      logger.info(`[${jobId}] Generating JSON metadata`);

      const jsonMetadata = {
        source: 'csv-to-xlsx',
        timestamp: new Date().toISOString(),
        stats: {
          rows: rows.length,
          columns: headers.length,
          headers,
        },
      };

      const metadataPath = path.join(storagePath, `${jobId}_metadata.json`);
      await fs.writeFile(metadataPath, JSON.stringify(jsonMetadata, null, 2));

      await job.updateProgress(100);
      logger.info(`[${jobId}] Conversion complete: ${outputFilename} (${rows.length} rows)`);

      return outputFilename;
    } catch (error) {
      logger.error(`[${jobId}] Conversion failed: ${error}`);
      throw error;
    }
  }
}
