import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FieldMapping, Workflow, WorkflowField } from '@/database/entities';
import { DataSource, In } from 'typeorm';
import { CreateFieldMappingDto } from '../dto';
import { RequestContext } from '@/shared/request-context/request-context.service';
import { BaseRepository } from '@/common/repositories/base.repository';

@Injectable()
export class FieldMappingService {
  private readonly logger = new Logger(FieldMappingService.name);
  private readonly workflowRepository: BaseRepository<Workflow>;

  constructor(
    private dataSource: DataSource,
    private readonly requestContext: RequestContext,
  ) {
    this.workflowRepository = new BaseRepository<Workflow>(
      Workflow,
      this.dataSource,
      this.requestContext,
    );
  }

  async getWorkflowFieldMappings(workflowId: string): Promise<FieldMapping[]> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['fieldMappings'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID '${workflowId}' not found`);
    }

    return workflow.fieldMappings || [];
  }

  async upsertFieldMappings(
    workflowId: string,
    fieldMappingsData: CreateFieldMappingDto[],
  ): Promise<FieldMapping[]> {
    if (!fieldMappingsData.length) {
      throw new BadRequestException('Field mappings cannot be empty');
    }

    return this.dataSource.transaction(async manager => {
      const workflowRepo = BaseRepository.fromManager(
        Workflow,
        manager,
        this.requestContext,
      );

      const fieldRepo = BaseRepository.fromManager(
        WorkflowField,
        manager,
        this.requestContext,
      );

      const fieldMappingRepo = BaseRepository.fromManager(
        FieldMapping,
        manager,
        this.requestContext,
      );

      const workflow = await workflowRepo.findOne({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Workflow with ID '${workflowId}' not found`,
        );
      }

      const workflowFieldIds = fieldMappingsData.map(
        mapping => mapping.workflowFieldId,
      );

      const existingFields = await fieldRepo.find({
        where: {
          id: In(workflowFieldIds),
          workflow: { id: workflowId },
        },
      });

      const existingFieldIds = existingFields.map(field => field.id);
      const missingFieldIds = workflowFieldIds.filter(
        id => !existingFieldIds.includes(id),
      );

      if (missingFieldIds.length > 0) {
        throw new NotFoundException(
          `Workflow field(s) with ID(s) '${missingFieldIds.join(', ')}' not found in workflow '${workflowId}'`,
        );
      }

      const savedMappings: FieldMapping[] = [];

      for (const mappingData of fieldMappingsData) {
        const workflowField = existingFields.find(
          field => field.id === mappingData.workflowFieldId,
        )!;

        const existingMapping = await fieldMappingRepo.findOne({
          where: {
            workflowField: { id: mappingData.workflowFieldId },
            targetType: mappingData.targetType,
            workflow: { id: workflowId },
          },
        });

        if (existingMapping) {
          existingMapping.target = mappingData.target ?? {};
          const savedMapping = await fieldMappingRepo.save(existingMapping);
          savedMappings.push(savedMapping);
        } else {
          const newMapping = fieldMappingRepo.create({
            target: mappingData.target,
            targetType: mappingData.targetType,
            workflow,
            workflowField,
          });
          const savedMapping = await fieldMappingRepo.save(newMapping);
          savedMappings.push(savedMapping);
        }
      }

      this.logger.log(
        `Upsert ${savedMappings.length} field mappings for workflow '${workflowId}'`,
      );
      return savedMappings;
    });
  }
}
