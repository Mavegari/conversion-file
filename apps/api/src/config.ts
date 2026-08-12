export const config = {
  api: {
    port: parseInt(process.env.API_PORT || '3000', 10),
    host: '0.0.0.0',
  },
  storage: {
    path: process.env.STORAGE_PATH || './storage',
  },
  upload: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  nodeEnv: process.env.NODE_ENV || 'development',
};

// Whitelist de mimetypes por tipo de conversión
export const ALLOWED_MIMETYPES: Record<string, string[]> = {
  'images-to-pdf': ['image/jpeg', 'image/png', 'image/webp'],
  'csv-to-xlsx': ['text/csv', 'text/plain'],
  'csv-to-json': ['text/csv', 'text/plain'],
  'office-to-pdf': [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ],
  'pdf-merge': ['application/pdf'],
  'pdf-split': ['application/pdf'],
  'pdf-compress': ['application/pdf'],
};
