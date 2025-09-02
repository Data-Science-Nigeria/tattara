import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileManagementEntity } from 'src/database/entities/file-management.entity';
import { FileManagementService } from './file-management.service';
import { FileManagementController } from './file-management.controller';

import multer from 'multer';

@Module({
  imports: [
    TypeOrmModule.forFeature([FileManagementEntity]),
    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
  ],
  providers: [FileManagementService],
  controllers: [FileManagementController],
})
export class FileManagementModule {}
