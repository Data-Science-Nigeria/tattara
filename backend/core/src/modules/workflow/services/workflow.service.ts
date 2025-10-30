/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { WorkflowStatus } from '@/common/enums';
import { PaginationResult } from '@/common/interfaces';
import { BaseRepository } from '@/common/repositories/base.repository';
import {
  ExternalConnection,
  Program,
  User,
  Workflow,
  WorkflowConfiguration,
} from '@/database/entities';
import { FormSchema } from '@/modules/ai/interfaces';
import { RequestContext } from '@/shared/request-context/request-context.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  ILike,
  In,
  QueryFailedError,
} from 'typeorm';
import { CreateWorkflowDto, UpdateWorkflowBasicDto } from '../dto';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);
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

  private getWorkflowRepo(manager: EntityManager) {
    return BaseRepository.fromManager(Workflow, manager, this.requestContext);
  }

  async createWorkflow(
    workflowData: CreateWorkflowDto,
    currentUser: User,
  ): Promise<Workflow> {
    return this.dataSource.transaction(async manager => {
      try {
        const { programId, workflowConfigurations, ...data } = workflowData;

        const workflowRepo = this.getWorkflowRepo(manager);
        const workflowConfigRepo = BaseRepository.fromManager(
          WorkflowConfiguration,
          manager,
          this.requestContext,
        );
        const programRepo = BaseRepository.fromManager(
          Program,
          manager,
          this.requestContext,
        );
        const externalConnectionRepo = BaseRepository.fromManager(
          ExternalConnection,
          manager,
          this.requestContext,
        );

        // const workflow = manager.create(Workflow, {
        //   ...data,
        //   createdBy: currentUser,
        // });

        const workflow = workflowRepo.create({
          ...data,
          createdBy: currentUser,
        });

        if (programId) {
          // const program = await manager.findOne(Program, {
          //   where: { id: programId },
          // });
          const program = await programRepo.findOne({
            where: { id: programId },
          });

          if (!program)
            throw new NotFoundException(
              `Program with ID '${programId}' not found`,
            );
          workflow.program = program;
        }

        const configurations: WorkflowConfiguration[] = [];
        for (const configDto of workflowConfigurations) {
          // const externalConnection = await manager.findOne(ExternalConnection, {
          //   where: { id: configDto.externalConnectionId },
          // });

          const externalConnection = await externalConnectionRepo.findOne({
            where: { id: configDto.externalConnectionId },
          });

          if (!externalConnection) {
            throw new NotFoundException(
              `External Connection with ID '${configDto.externalConnectionId}' not found`,
            );
          }

          // const configEntity = manager.create(WorkflowConfiguration, {
          //   ...configDto,
          //   externalConnection,
          // });

          const configEntity = workflowConfigRepo.create({
            ...configDto,
            externalConnection,
          });

          configurations.push(configEntity);
        }

        workflow.workflowConfigurations = configurations;

        // return await manager.save(workflow);
        return await workflowRepo.save(workflow);
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          (error as any).code === '23505'
        ) {
          this.logger.warn(
            `Workflow name must be unique. A workflow with the name '${workflowData.name}' already exists.`,
          );
          throw new ConflictException(
            `Workflow name must be unique. A workflow with the name '${workflowData.name}' already exists.`,
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

  async getWorkflows(
    currentUser: User,
    userId?: string | string[],
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginationResult<Workflow>> {
    const alias = 'workflow';
    const qb = this.workflowRepository.withScope(alias);

    qb.leftJoinAndSelect(`${alias}.workflowFields`, 'workflowFields')
      .leftJoinAndSelect(`${alias}.fieldMappings`, 'fieldMappings')
      .leftJoinAndSelect(
        `${alias}.workflowConfigurations`,
        'workflowConfigurations',
      )
      .leftJoinAndSelect(`${alias}.createdBy`, 'createdBy')
      .leftJoinAndSelect(`${alias}.program`, 'program')
      .andWhere(`${alias}.status = :status`, { status: WorkflowStatus.ACTIVE });

    if (currentUser.hasRole('user') && !currentUser.hasRole('admin')) {
      qb.innerJoin(`${alias}.users`, 'user').andWhere('user.id = :userId', {
        userId: currentUser.id,
      });
    } else if (userId) {
      const targetUserIds = Array.isArray(userId) ? userId : [userId];
      qb.innerJoin(`${alias}.users`, 'user').andWhere(
        'user.id IN (:...userIds)',
        { userIds: targetUserIds },
      );
    }

    const [workflows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: workflows,
      page,
      limit,
      total,
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
        'workflowConfigurations.workflow',
        'workflowFields.fieldMappings',
        'createdBy',
        'users',
        'program',
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
      const workflowRepo = this.getWorkflowRepo(manager);

      const workflow = await workflowRepo.findOne({
        where: { id: workflowId },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Workflow with ID '${workflowId}' not found`,
        );
      }

      try {
        Object.assign(workflow, updateData);
        // return await manager.save(workflow);
        return await workflowRepo.save(workflow);
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
      const workflowRepo = this.getWorkflowRepo(manager);

      const workflow = await workflowRepo.findOne({
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
