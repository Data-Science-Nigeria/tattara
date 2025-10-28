import {
  FieldMapping,
  Workflow,
  WorkflowConfiguration,
  WorkflowField,
} from '@/database/entities';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigurationController } from './controllers/configuration.controller';
import { FieldMappingController } from './controllers/field-mapping.controller';
import { FieldController } from './controllers/field.controller';
import { WorkflowController } from './controllers/workflow.controller';
import { ConfigurationService } from './services/configuration.service';
import { FieldMappingService } from './services/field-mapping.service';
import { FieldService } from './services/field.service';
import { WorkflowService } from './services/workflow.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowField,
      FieldMapping,
      WorkflowConfiguration,
    ]),
  ],
  providers: [
    WorkflowService,
    FieldService,
    ConfigurationService,
    FieldMappingService,
  ],
  controllers: [
    WorkflowController,
    FieldController,
    ConfigurationController,
    FieldMappingController,
  ],
  exports: [
    WorkflowService,
    FieldService,
    ConfigurationService,
    FieldMappingService,
  ],
})
export class WorkflowModule {}
