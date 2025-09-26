import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { FieldMapping, Workflow, WorkflowField } from 'src/database/entities';
import { DataSource, In, Repository } from 'typeorm';
import { CreateFieldMappingDto } from '../dto';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class FieldMappingService {
  private readonly logger = new Logger(FieldMappingService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
  ) {}

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
      const workflow = await manager.findOne(Workflow, {
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
      const existingFields = await manager.find(WorkflowField, {
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

        const existingMapping = await manager.findOne(FieldMapping, {
          where: {
            workflowField: { id: mappingData.workflowFieldId },
            targetType: mappingData.targetType,
            workflow: { id: workflowId },
          },
        });

        if (existingMapping) {
          existingMapping.target = mappingData.target ?? {};
          const savedMapping = await manager.save(existingMapping);
          savedMappings.push(savedMapping);
        } else {
          const newMapping = manager.create(FieldMapping, {
            target: mappingData.target,
            targetType: mappingData.targetType,
            workflow,
            workflowField,
          });
          const savedMapping = await manager.save(newMapping);
          savedMappings.push(savedMapping);
        }
      }

      this.logger.log(
        `Upserted ${savedMappings.length} field mappings for workflow '${workflowId}'`,
      );
      return savedMappings;
    });
  }
}
