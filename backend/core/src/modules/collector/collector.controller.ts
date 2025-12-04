import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Roles } from '@/common/decorators';
import { User } from '@/database/entities';
import { CollectorService } from './collector.service';
import { ProcessAiDto, GetSubmissionHistoryDto } from './dto';
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

  /** Submit collected data */
  @Post('/submit')
  @Roles('user')
  async submitData(@Body() submitDto: SubmitDto, @CurrentUser() user: User) {
    return this.collectorService.submit(submitDto, user);
  }

  /**
   * Get submission history - scoped by role:
   * - Users: Only their own submissions
   * - Admins: Submissions from users they created
   * - Super-admins: All submissions
   */
  @Get('/submissions')
  async getSubmissionHistory(@Query() query: GetSubmissionHistoryDto) {
    return this.collectorService.getSubmissionHistory(query);
  }

  /**
   * Get a single submission by ID - scoped by role:
   * - Users: Only their own submissions
   * - Admins: Submissions from users they created
   * - Super-admins: All submissions
   */
  @Get('/submissions/:id')
  async getSubmissionById(@Param('id', ParseUUIDPipe) id: string) {
    return this.collectorService.getSubmissionById(id);
  }
}
