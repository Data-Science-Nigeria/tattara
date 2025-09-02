import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { FileManagementEntity } from 'src/database/entities/file-management.entity';
import { Repository } from 'typeorm';

@Injectable()
export class FileManagementService {
  private readonly s3 = new S3Client({
    region: process.env.AWS_REGION as string,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    },
  });

  private readonly bucketName = process.env.AWS_S3_BUCKET as string;

  constructor(
    @InjectRepository(FileManagementEntity)
    private readonly fileRepo: Repository<FileManagementEntity>,
  ) {}

  async uploadFile(file: Express.Multer.File): Promise<FileManagementEntity> {
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

      // Save metadata in DB
      const savedFile = this.fileRepo.create({
        id: fileId,
        key,
        url: fileUrl,
        mimetype: file.mimetype,
        size: file.size,
      });
      return this.fileRepo.save(savedFile);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('File upload failed');
    }
  }

  async findAll(): Promise<FileManagementEntity[]> {
    return this.fileRepo.find();
  }

  async findOne(id: string): Promise<FileManagementEntity | null> {
    return this.fileRepo.findOne({ where: { id } });
  }
}
