/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { WorkflowStatus } from 'src/common/enums';
import { PaginationResult } from 'src/common/interfaces';
import { Program, User, Workflow } from 'src/database/entities';
import { DataSource, ILike, In, QueryFailedError, Repository } from 'typeorm';
import { CreateWorkflowDto, UpdateWorkflowBasicDto } from '../dto';
import { FormSchema } from 'src/modules/ai/interfaces';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private dataSource: DataSource,
  ) {}

  async createWorkflow(workflowData: CreateWorkflowDto): Promise<Workflow> {
    return this.dataSource.transaction(async manager => {
      try {
        const { programId, ...data } = workflowData;

        const workflow = manager.create(Workflow, {
          ...data,
        });

        if (programId) {
          const program = await manager.findOne(Program, {
            where: { id: programId },
          });

          if (!program) {
            throw new NotFoundException(
              `Program with ID '${programId}' not found`,
            );
          }

          workflow.program = program;
        }

        return await manager.save(workflow);
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          (error as any).code === '23505'
        ) {
          this.logger.warn(
            `Workflow creation failed - name already exists: ${workflowData.name}`,
          );
          throw new ConflictException(
            `Workflow with name '${workflowData.name}' already exists`,
          );
        }
        this.logger.error(
          `Failed to create workflow: ${error.message}`,
          error.stack,
        );
        throw error;
      }
    });
  }

  async findWorkflowsWithPagination(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<Workflow>> {
    const [workflows, total] = await this.workflowRepository.findAndCount({
      relations: ['workflowFields', 'fieldMappings', 'workflowConfigurations'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      where: { status: WorkflowStatus.ACTIVE },
    });

    return {
      data: workflows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findWorkflowById(workflowId: string): Promise<Workflow> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: [
        'workflowFields',
        'fieldMappings',
        'workflowConfigurations',
        'workflowFields.fieldMappings',
      ],
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return workflow;
  }

  async findWorkflowByIdWithSchema(
    workflowId: string,
  ): Promise<{ workflow: Workflow; schema: FormSchema[] }> {
    const workflow = await this.findWorkflowById(workflowId);

    const schema: FormSchema[] = workflow.workflowFields.map(f => ({
      id: f.fieldName,
      type: f.fieldType,
      required: f.isRequired,
      // TODO: support flexible validation rules in future; tell ai devs
    }));

    return { workflow, schema };
  }

  async searchWorkflows(
    searchQuery: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<Workflow>> {
    if (!searchQuery || searchQuery.trim().length === 0) {
      throw new BadRequestException('Search query cannot be empty');
    }

    const trimmedQuery = searchQuery.trim();

    const [workflows, total] = await this.workflowRepository.findAndCount({
      relations: ['workflowFields', 'fieldMappings', 'workflowConfigurations'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      where: [
        {
          name: ILike(`%${trimmedQuery}%`),
          status: WorkflowStatus.ACTIVE,
        },
        {
          description: ILike(`%${trimmedQuery}%`),
          status: WorkflowStatus.ACTIVE,
        },
      ],
    });

    this.logger.log(`Search for "${trimmedQuery}" returned ${total} results`);

    return {
      data: workflows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateWorkflowBasicInfo(
    workflowId: string,
    updateData: UpdateWorkflowBasicDto,
  ): Promise<Workflow> {
    return this.dataSource.transaction(async manager => {
      const workflow = await manager.findOne(Workflow, {
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Workflow with ID '${workflowId}' not found`,
        );
      }

      try {
        Object.assign(workflow, updateData);
        return await manager.save(workflow);
      } catch (error) {
        if (error.code === '23505') {
          throw new ConflictException(
            `Workflow with name '${updateData.name}' already exists`,
          );
        }
        throw error;
      }
    });
  }

  async archiveWorkflow(workflowId: string): Promise<void> {
    const result = await this.workflowRepository.update(workflowId, {
      status: WorkflowStatus.ARCHIVED,
    });

    if (result.affected === 0) {
      throw new NotFoundException(`Workflow with ID '${workflowId}' not found`);
    }

    this.logger.log(`Workflow '${workflowId}' archived successfully`);
  }

  async assignUsersToWorkflow(
    workflowId: string,
    userIds: string[],
  ): Promise<Workflow> {
    return this.dataSource.transaction(async manager => {
      const workflow = await manager.findOne(Workflow, {
        where: { id: workflowId },
        relations: ['users'],
        select: ['id', 'users'],
      });

      if (!workflow) {
        throw new NotFoundException(
          `Workflow with ID '${workflowId}' not found`,
        );
      }

      const users = await manager.findBy(User, { id: In(userIds) });

      if (users.length !== userIds.length) {
        const foundUserIds = users.map(user => user.id);
        const nonExistentIds = userIds.filter(id => !foundUserIds.includes(id));
        throw new NotFoundException(
          `User(s) with ID(s) '${nonExistentIds.join(', ')}' not found`,
        );
      }

      workflow.users = users;

      return await manager.save(workflow);
    });
  }
}
