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
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators';
import { User } from '@/database/entities';
import { CollectorService } from './collector.service';
import {
  ProcessAiDto,
  GetSubmissionHistoryDto,
  ProcessAiResponseDto,
} from './dto';
import { SubmitDto } from './dto/submit.dto';

@ApiTags('Collector')
@Controller('collector')
export class CollectorController {
  constructor(private readonly collectorService: CollectorService) {}

  @Post('/process-ai')
  @ApiOperation({
    summary: 'Process AI data',
    description:
      'Accepts multiple files for processing AI data including text, audio, and images. Accepts language parameter for audio processing.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Files to process (images, audio, documents)',
        },
        workflowId: {
          type: 'string',
          format: 'uuid',
          description: 'The workflow ID to process',
        },
        processingType: {
          type: 'string',
          description: 'Type of processing to perform',
        },
        aiProvider: {
          type: 'string',
          description: 'AI provider to use (optional)',
        },
        text: {
          type: 'string',
          description: 'Text content to process (optional)',
        },
        language: {
          type: 'string',
          description: 'Language for audio processing (optional)',
        },
      },
      required: ['workflowId', 'processingType'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'AI processing completed successfully',
    type: ProcessAiResponseDto,
  })
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
