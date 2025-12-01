import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { removeUndefinedProperties } from '@/common/utils';
import { Workflow, WorkflowField } from '@/database/entities';
import { DataSource, Repository } from 'typeorm';

@Injectable()
export class FieldService {
  private readonly logger = new Logger(FieldService.name);

  constructor(
    @InjectRepository(WorkflowField)
    private workflowFieldRepository: Repository<WorkflowField>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private dataSource: DataSource,
  ) {}

  async getWorkflowFields(workflowId: string): Promise<WorkflowField[]> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['workflowFields'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID '${workflowId}' not found`);
    }

    return workflow.workflowFields || [];
  }

  async upsertWorkflowFields(
    workflowId: string,
    fieldsData: Partial<WorkflowField>[],
  ): Promise<WorkflowField[]> {
    if (!fieldsData.length) {
      throw new BadRequestException('Fields data cannot be empty');
    }

    return this.dataSource.transaction(async manager => {
      const workflow = await manager.findOne(Workflow, {
        where: { id: workflowId },
        relations: ['workflowFields'],
      });

      if (!workflow) {
        throw new NotFoundException(
          `Workflow with ID '${workflowId}' not found`,
        );
      }

      const existingFieldIds = workflow.workflowFields.map(field => field.id);

      const fieldsToUpdate: Partial<WorkflowField>[] = [];
      const fieldsToCreate: Omit<Partial<WorkflowField>, 'id'>[] = [];

      fieldsData.forEach(fieldData => {
        if (fieldData.id && existingFieldIds.includes(fieldData.id)) {
          fieldsToUpdate.push(fieldData);
        } else {
          fieldsToCreate.push(fieldData);
        }
      });

      // Update existing fields
      if (fieldsToUpdate.length > 0) {
        for (const fieldUpdate of fieldsToUpdate) {
          const { id, ...updateFields } = fieldUpdate;
          const cleanUpdateFields = removeUndefinedProperties(updateFields);

          if (Object.keys(cleanUpdateFields).length > 0) {
            await manager.update(WorkflowField, id, cleanUpdateFields);
          }
        }
      }

      // Create new fields
      if (fieldsToCreate.length > 0) {
        const newFields = fieldsToCreate.map(fieldData =>
          manager.create(WorkflowField, {
            workflow,
            ...fieldData,
          }),
        );
        await manager.save(newFields);
      }

      return manager.find(WorkflowField, {
        where: { workflow: { id: workflowId } },
        order: { createdAt: 'ASC' },
      });
    });
  }

  async removeWorkflowField(fieldId: string): Promise<void> {
    const result = await this.workflowFieldRepository.delete(fieldId);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Workflow field with ID '${fieldId}' not found`,
      );
    }

    this.logger.log(`Workflow field '${fieldId}' removed successfully`);
  }
}
