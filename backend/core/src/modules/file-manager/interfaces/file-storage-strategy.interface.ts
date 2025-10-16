import { FileUploads } from '@/database/entities';

export interface FileStorageStrategy {
  upload(file: Express.Multer.File): Promise<FileUploads>;
  delete(filePath: string): Promise<void>;
  findAll(): Promise<FileUploads[]>;
  findOne(id: string): Promise<FileUploads | null>;
}
