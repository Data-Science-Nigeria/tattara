import { FileStorageStrategy } from '../interfaces';
import { ConfigService } from '@nestjs/config';
import { BlobServiceClient, BlockBlobClient } from '@azure/storage-blob';
import { v4 as uuidv4 } from 'uuid';
import { InternalServerErrorException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FileUploads } from 'src/database/entities';
import { InjectRepository } from '@nestjs/typeorm';

export class AzureBlobStrategy implements FileStorageStrategy {
  private readonly blobServiceClient: BlobServiceClient;
  private readonly containerName: string;

  constructor(
    @InjectRepository(FileUploads)
    private readonly fileRepo: Repository<FileUploads>,
    private readonly configService: ConfigService,
  ) {
    const connectionString =
      this.configService.get<string>('azure.connectionString') ?? '';
    if (
      !connectionString ||
      !connectionString.startsWith('DefaultEndpointsProtocol')
    ) {
      throw new Error('Azure connection string is missing or invalid');
    }
    this.containerName =
      this.configService.get<string>('azure.container') ?? '';
    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  async upload(file: Express.Multer.File): Promise<FileUploads> {
    const fileId = uuidv4();
    const blobName = `${fileId}-${file.originalname}`;
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const blockBlobClient: BlockBlobClient =
      containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      const fileUrl = blockBlobClient.url;

      const savedFile = this.fileRepo.create({
        id: fileId,
        originalFilename: blobName,
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

  async delete(filePath: string): Promise<void> {
    const containerClient = this.blobServiceClient.getContainerClient(
      this.containerName,
    );
    const blobName = filePath.split('/').pop() ?? '';
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    try {
      await blockBlobClient.delete();
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
