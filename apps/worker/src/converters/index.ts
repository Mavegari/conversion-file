import { Job } from 'bullmq';
import { PrismaClient } from '@conversion-file/shared';
import pino from 'pino';

export interface ConverterContext {
  jobId: string;
  type: string;
  inputPaths: string[];
  outputPath?: string;
  prisma: PrismaClient;
  logger: pino.Logger;
  job: Job;
}

export interface Converter {
  handle(context: ConverterContext): Promise<string>;
}

export const converterRegistry: Record<string, Converter> = {};

export function registerConverter(type: string, converter: Converter): void {
  converterRegistry[type] = converter;
}

export function getConverter(type: string): Converter | undefined {
  return converterRegistry[type];
}

export async function processJob(
  job: Job,
  type: string,
  inputPaths: string[],
  prisma: PrismaClient,
  logger: pino.Logger
): Promise<string> {
  const converter = getConverter(type);
  if (!converter) {
    throw new Error(`No converter found for type: ${type}`);
  }

  const context: ConverterContext = {
    jobId: job.id!,
    type,
    inputPaths,
    prisma,
    logger,
    job,
  };

  return converter.handle(context);
}
