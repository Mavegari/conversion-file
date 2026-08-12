import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { config } from './config';

export class StorageService {
  private storagePath = config.storage.path;

  async ensureStorageDir(): Promise<void> {
    await fs.mkdir(this.storagePath, { recursive: true });
  }

  async saveFile(buffer: Buffer, originalName: string, jobId: string): Promise<string> {
    await this.ensureStorageDir();

    // Generar nombre único: jobId_timestamp_hash
    const ext = path.extname(originalName);
    const hash = crypto.randomBytes(8).toString('hex');
    const filename = `${jobId}_${Date.now()}_${hash}${ext}`;
    const filePath = path.join(this.storagePath, filename);

    await fs.writeFile(filePath, buffer);
    return filename;
  }

  async getFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.storagePath, filename);
    // Prevenir path traversal
    if (!filePath.startsWith(this.storagePath)) {
      throw new Error('Invalid file path');
    }
    return fs.readFile(filePath);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.storagePath, filename);
    // Prevenir path traversal
    if (!filePath.startsWith(this.storagePath)) {
      throw new Error('Invalid file path');
    }
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Archivo no existe, ignorar
    }
  }

  getFullPath(filename: string): string {
    return path.join(this.storagePath, filename);
  }
}

export const storageService = new StorageService();
