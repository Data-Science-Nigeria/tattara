import { FileStorageStrategy } from '../interfaces';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileUploads } from '@/database/entities';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import { promises as fsPromises } from 'fs';
import * as path from 'path';

@Injectable()
export class LocalStorageStrategy implements FileStorageStrategy {
  private readonly uploadDir: string;

  constructor(
    @InjectRepository(FileUploads)
    private readonly fileRepo: Repository<FileUploads>,
  ) {
    this.uploadDir = path.resolve(__dirname, '../../../../uploads'); // TODO: set the folder location as a config var
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File): Promise<FileUploads> {
    const fileId = uuidv4();
    const filename = `${fileId}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, filename);

    try {
      fs.writeFileSync(filePath, file.buffer);
      const fileUrl = `/uploads/${filename}`;
      const savedFile = this.fileRepo.create({
        id: fileId,
        originalFilename: filename,
        storagePath: fileUrl,
        mimetype: file.mimetype,
        fileSize: file.size,
        storageProvider: 'local',
      });
      return this.fileRepo.save(savedFile);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Local file upload failed');
    }
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.uploadDir, path.basename(filePath));
    try {
      if (fs.existsSync(fullPath)) {
        await fsPromises.unlink(fullPath);
      }
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Local file delete failed');
    }
  }

  async findAll(): Promise<FileUploads[]> {
    return this.fileRepo.find();
  }

  async findOne(id: string): Promise<FileUploads | null> {
    return this.fileRepo.findOne({ where: { id } });
  }
}
