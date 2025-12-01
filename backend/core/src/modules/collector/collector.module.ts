import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  AiProcessingLog,
  ExternalConnection,
  FileUploads,
  Submission,
  Workflow,
} from '@/database/entities';
import { AiModule } from '../ai/ai.module';
import { FileManagerModule } from '../file-manager/file-manager.module';
import { WorkflowModule } from '../workflow/workflow.module';
import { CollectorController } from './collector.controller';
import { CollectorService } from './collector.service';
import { IntegrationModule } from '../integration/integration.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      AiProcessingLog,
      FileUploads,
      ExternalConnection,
      Submission,
    ]),
    AiModule,
    FileManagerModule,
    WorkflowModule,
    IntegrationModule,
  ],
  providers: [CollectorService],
  controllers: [CollectorController],
})
export class CollectorModule {}
