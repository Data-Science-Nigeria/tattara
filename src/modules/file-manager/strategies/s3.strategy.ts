import { FileStorageStrategy } from '../interfaces';
import { InjectRepository } from '@nestjs/typeorm';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerErrorException } from '@nestjs/common';
import { FileUploads } from 'src/database/entities';

export class S3Strategy implements FileStorageStrategy {
  private readonly s3: S3Client;
  private readonly bucketName: string;

  constructor(
    @InjectRepository(FileUploads)
    private readonly fileRepo: Repository<FileUploads>,
    private readonly configService: ConfigService,
  ) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('aws.region') ?? '',
      credentials: {
        accessKeyId: this.configService.get<string>('aws.keyId') ?? '',
        secretAccessKey: this.configService.get<string>('aws.secret') ?? '',
      },
    });
    this.bucketName = this.configService.get<string>('aws.bucket') ?? '';
  }

  async upload(file: Express.Multer.File): Promise<FileUploads> {
    const fileId = uuidv4();
    const key = `${fileId}-${file.originalname}`;

    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );

      const fileUrl = `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

      // save metadata in DB
      const savedFile = this.fileRepo.create({
        id: fileId,
        originalFilename: key,
        storagePath: fileUrl,
        mimetype: file.mimetype,
        fileSize: file.size,
      });
      return this.fileRepo.save(savedFile);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('File upload failed');
    }
  }

  async delete(id: string): Promise<void> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) {
      throw new InternalServerErrorException('File not found');
    }

    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: file.originalFilename,
        }),
      );

      await this.fileRepo.delete({ id });
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('File delete failed');
    }
  }

  async findAll(): Promise<FileUploads[]> {
    return this.fileRepo.find();
  }

  async findOne(id: string): Promise<FileUploads | null> {
    return this.fileRepo.findOne({ where: { id } });
  }
}
