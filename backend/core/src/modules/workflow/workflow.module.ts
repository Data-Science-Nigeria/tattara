import { Module } from '@nestjs/common';
import { WorkflowService } from './services/workflow.service';
import { WorkflowController } from './controllers/workflow.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FieldMapping,
  Workflow,
  WorkflowConfiguration,
  WorkflowField,
} from 'src/database/entities';
import { FieldController } from './controllers/field.controller';
import { ConfigurationController } from './controllers/configuration.controller';
import { FieldMappingController } from './controllers/field-mapping.controller';
import { FieldService } from './services/field.service';
import { ConfigurationService } from './services/configuration.service';
import { FieldMappingService } from './services/field-mapping.service';

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
