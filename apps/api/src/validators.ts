import { ALLOWED_MIMETYPES } from './config';
import { JOB_TYPES } from '@conversion-file/shared';
import { BadRequest } from './errors';

export function validateJobType(type: string): void {
  const validTypes = Object.values(JOB_TYPES);
  if (!validTypes.includes(type as any)) {
    throw new BadRequest(`Invalid job type. Allowed: ${validTypes.join(', ')}`, 'INVALID_JOB_TYPE');
  }
}

export function validateMimetype(type: string, mimeType: string): void {
  const allowedMimetypes = ALLOWED_MIMETYPES[type];
  if (!allowedMimetypes) {
    throw new BadRequest(`No mimetypes configured for type: ${type}`);
  }
  if (!allowedMimetypes.includes(mimeType)) {
    throw new BadRequest(
      `Mimetype ${mimeType} not allowed for ${type}. Allowed: ${allowedMimetypes.join(', ')}`,
      'INVALID_MIMETYPE'
    );
  }
}

export function validateFileSize(size: number, maxSize: number): void {
  if (size > maxSize) {
    throw new BadRequest(
      `File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`,
      'FILE_TOO_LARGE'
    );
  }
}
