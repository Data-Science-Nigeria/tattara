import { BaseRepository } from '@/common/repositories/base.repository';
import { removeUndefinedProperties } from '@/common/utils';
import { Workflow, WorkflowField } from '@/database/entities';
import { RequestContext } from '@/shared/request-context/request-context.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';

@Injectable()
export class FieldService {
  private readonly logger = new Logger(FieldService.name);
  private readonly workflowFieldRepository: BaseRepository<WorkflowField>;
  private readonly workflowRepository: BaseRepository<Workflow>;

  constructor(
    private dataSource: DataSource,
    private readonly requestContext: RequestContext,
  ) {
    this.workflowFieldRepository = new BaseRepository<WorkflowField>(
      WorkflowField,
      this.dataSource,
      this.requestContext,
    );
    this.workflowRepository = new BaseRepository<Workflow>(
      Workflow,
      this.dataSource,
      this.requestContext,
    );
  }

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

      const workflow = await workflowRepo.findOne({
        where: { id: workflowId },
        relations: ['workflowFields'],
      });

      if (!workflow) {
        throw new NotFoundException(
          `Workflow with ID '${workflowId}' not found`,
        );
      }

      const fieldsToUpdate: Partial<WorkflowField>[] = [];
      const fieldsToCreate: Omit<Partial<WorkflowField>, 'id'>[] = [];

      fieldsData.forEach(fieldData => {
        if (fieldData.id) {
          fieldsToUpdate.push(fieldData);
        } else {
          fieldsToCreate.push(fieldData);
        }
      });

      // Update existing fields
      if (fieldsToUpdate.length > 0) {
        const updateIds = fieldsToUpdate.map(field => field.id!);

        const existingFields = await fieldRepo.find({
          where: {
            id: In(updateIds),
            workflow: { id: workflowId },
          },
        });

        const existingFieldMap = new Map(
          existingFields.map(field => [field.id, field]),
        );

        const nonExistentIds = updateIds.filter(
          id => !existingFieldMap.has(id),
        );

        if (nonExistentIds.length > 0) {
          throw new NotFoundException(
            `Field(s) with ID(s) '${nonExistentIds.join(', ')}' not found for workflow '${workflowId}'`,
          );
        }

        const fieldsToSave = fieldsToUpdate.map(fieldUpdate => {
          const { id, ...updateFields } = fieldUpdate;
          const existingField = existingFieldMap.get(id!)!;
          const cleanUpdateFields = removeUndefinedProperties(updateFields);

          return fieldRepo.create({
            ...existingField,
            ...cleanUpdateFields,
            id: id!,
          });
        });

        await fieldRepo.save(fieldsToSave);
      }

      // Create new fields
      if (fieldsToCreate.length > 0) {
        const newFields = fieldsToCreate.map(fieldData =>
          fieldRepo.create({
            workflow,
            ...fieldData,
          }),
        );
        await fieldRepo.save(newFields);
      }

      return fieldRepo.find({
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
