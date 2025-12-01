import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileManagerService } from './file-manager.service';
import { FileUploads } from '@/database/entities';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('file-manager')
export class FileManagerController {
  constructor(private readonly FileManagerService: FileManagerService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FileUploads> {
    return this.FileManagerService.upload(file);
  }

  @Get()
  async getAll(): Promise<FileUploads[]> {
    return this.FileManagerService.findAll();
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<FileUploads | null> {
    return this.FileManagerService.findOne(id);
  }

  @Delete(':id')
  async deleteFile(@Param('id') id: string) {
    return this.FileManagerService.delete(id);
  }

  @Post('provider')
  setProvider(@Body('provider') provider: 's3' | 'azure' | 'local') {
    this.FileManagerService.setStrategy(provider);
    return { message: `Provider switched to ${provider}` };
  }
}
