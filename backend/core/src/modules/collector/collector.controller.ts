import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Roles } from 'src/common/decorators';
import { User } from 'src/database/entities';
import { CollectorService } from './collector.service';
import { ProcessAiDto } from './dto';
import { SubmitDto } from './dto/submit.dto';

@Controller('collector')
export class CollectorController {
  constructor(private readonly collectorService: CollectorService) {}

  @Post('/process-ai')
  @Roles('user')
  @UseInterceptors(FilesInterceptor('files'))
  async processAi(
    @Body() processAiDto: ProcessAiDto,
    @CurrentUser() user: User,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    return this.collectorService.processAi({ ...processAiDto, files }, user);
  }

  @Post('/submit')
  @Roles('user')
  async submitData(@Body() submitDto: SubmitDto, @CurrentUser() user: User) {
    return this.collectorService.submit(submitDto, user);
  }
}
