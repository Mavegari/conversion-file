// Shared types and utilities
export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface Job {
  id: string;
  type: string;
  status: JobStatus;
  progress: number;
  inputPaths: string[];
  outputPath?: string;
  originalName: string;
  mimeType: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
}

export const CONVERSION_TYPES = {
  IMAGES_TO_PDF: 'images-to-pdf',
  CSV_TO_XLSX: 'csv-to-xlsx',
  CSV_TO_JSON: 'csv-to-json',
  OFFICE_TO_PDF: 'office-to-pdf',
  PDF_MERGE: 'pdf-merge',
  PDF_SPLIT: 'pdf-split',
  PDF_COMPRESS: 'pdf-compress',
} as const;