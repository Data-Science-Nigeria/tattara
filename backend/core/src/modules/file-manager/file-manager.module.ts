import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileUploads } from '@/database/entities';
import { FileManagerService } from './file-manager.service';
import { FileManagerController } from './file-manager.controller';

import multer from 'multer';
// import { S3Strategy } from './strategies';
// import { AzureBlobStrategy } from './strategies';
import { LocalStorageStrategy } from './strategies';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileUploads]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  providers: [
    FileManagerService,
    // S3Strategy,
    // AzureBlobStrategy,
    LocalStorageStrategy,
  ],
  controllers: [FileManagerController],
  exports: [
    // S3Strategy,
    //  AzureBlobStrategy,
    FileManagerService,
    LocalStorageStrategy,
  ],
})
export class FileManagerModule {}
