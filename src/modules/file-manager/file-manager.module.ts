import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploads } from 'src/database/entities';
import { FileManagerService } from './file-manager.service';
import { FileManagerController } from './file-manager.controller';

import multer from 'multer';
import { S3Strategy } from './strategies/s3.strategy';
import { AzureBlobStrategy } from './strategies/azure-blob.strategy';
import { LocalStorageStrategy } from './strategies/local-storage.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUploads]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  providers: [
    FileManagerService,
    S3Strategy,
    AzureBlobStrategy,
    LocalStorageStrategy,
  ],
  controllers: [FileManagerController],
  exports: [S3Strategy, AzureBlobStrategy, LocalStorageStrategy],
})
export class FileManagerModule {}
