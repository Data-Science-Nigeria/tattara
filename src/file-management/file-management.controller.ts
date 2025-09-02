import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileManagementService } from './file-management.service';
import { FileManagementEntity } from 'src/database/entities/file-management.entity';
// ...existing code...

@Controller('file-management')
export class FileManagementController {
  constructor(private readonly fileManagementService: FileManagementService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileManagementEntity> {
    return this.fileManagementService.uploadFile(file);
  }

  @Get()
  async getAll(): Promise<FileManagementEntity[]> {
    return this.fileManagementService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<FileManagementEntity | null> {
    return this.fileManagementService.findOne(id);
  }
}
