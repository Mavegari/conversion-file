// Re-exportar el cliente Prisma para que otros packages lo usen
export { PrismaClient } from '@prisma/client';
export type { Job } from '@prisma/client';

// Enums y constantes para tipos de conversión
export const JOB_TYPES = {
  IMAGES_TO_PDF: 'images-to-pdf',
  CSV_TO_XLSX: 'csv-to-xlsx',
  CSV_TO_JSON: 'csv-to-json',
  OFFICE_TO_PDF: 'office-to-pdf',
  PDF_MERGE: 'pdf-merge',
  PDF_SPLIT: 'pdf-split',
  PDF_COMPRESS: 'pdf-compress',
} as const;

export const JOB_STATUS = {
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
} as const;

export type JobType = (typeof JOB_TYPES)[keyof typeof JOB_TYPES];
export type JobStatus = (typeof JOB_STATUS)[keyof typeof JOB_STATUS];
