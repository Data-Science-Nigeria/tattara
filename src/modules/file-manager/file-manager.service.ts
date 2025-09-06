import { Injectable } from '@nestjs/common';
import { FileStorageStrategy } from './interfaces';
import { S3Strategy } from './strategies';
import { AzureBlobStrategy } from './strategies';
import { LocalStorageStrategy } from './strategies';

@Injectable()
export class FileManagerService {
  private strategy: FileStorageStrategy;

  constructor(
    private readonly s3Strategy: S3Strategy,
    private readonly azureBlobStrategy: AzureBlobStrategy,
    private readonly localStorageStrategy: LocalStorageStrategy,
  ) {
    // Default strategy
    this.strategy = s3Strategy;
  }

  public setStrategy(strategy: 's3' | 'azure' | 'local'): void {
    switch (strategy) {
      case 'azure':
        this.strategy = this.azureBlobStrategy;
        break;
      case 'local':
        this.strategy = this.localStorageStrategy;
        break;
      case 's3':
      default:
        this.strategy = this.s3Strategy;
        break;
    }
  }

  async upload(file: Express.Multer.File) {
    return this.strategy.upload(file);
  }

  async delete(filePath: string) {
    return this.strategy.delete(filePath);
  }

  async findAll() {
    return this.strategy.findAll();
  }

  async findOne(id: string) {
    return this.strategy.findOne(id);
  }
}
