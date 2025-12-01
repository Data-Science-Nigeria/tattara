import { BaseRepository } from '@/common/repositories/base.repository';
import { User, Workflow, WorkflowConfiguration } from '@/database/entities';
import { RequestContext } from '@/shared/request-context/request-context.service';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, FindOptionsWhere, In } from 'typeorm';
import { UpdateConfigurationDto } from '../dto';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);
  private readonly workflowRepository: BaseRepository<Workflow>;
  private readonly workflowConfigurationRepository: BaseRepository<WorkflowConfiguration>;

  constructor(
    // @InjectRepository(Workflow)
    // private workflowRepository: Repository<Workflow>,
    // @InjectRepository(WorkflowConfiguration)
    // private workflowConfigurationRepository: Repository<WorkflowConfiguration>,
    private dataSource: DataSource,
    private readonly requestContext: RequestContext,
  ) {
    this.workflowRepository = new BaseRepository<Workflow>(
      Workflow,
      this.dataSource,
      this.requestContext,
    );
    this.workflowConfigurationRepository =
      new BaseRepository<WorkflowConfiguration>(
        WorkflowConfiguration,
        this.dataSource,
        this.requestContext,
      );
  }

  async upsertWorkflowConfigurations(
    workflowId: string,
    configurationsData: UpdateConfigurationDto[],
  ): Promise<WorkflowConfiguration[]> {
    if (!configurationsData.length) {
      throw new BadRequestException('Configuration data cannot be empty');
    }

    return this.dataSource.transaction(async manager => {
      const workflowRepo = BaseRepository.fromManager(
        Workflow,
        manager,
        this.requestContext,
      );

      const workflowConfigRepo = BaseRepository.fromManager(
        WorkflowConfiguration,
        manager,
        this.requestContext,
      );

      const workflow = await workflowRepo.findOne({
        where: {
          id: workflowId,
        },
      });

      if (!workflow) {
        throw new NotFoundException(
          `Workflow with ID '${workflowId}' not found`,
        );
      }

      const configurationsToUpdate: UpdateConfigurationDto[] = [];
      const configurationsToCreate: Omit<UpdateConfigurationDto, 'id'>[] = [];

      configurationsData.forEach(config => {
        if (config.id) {
          configurationsToUpdate.push(config);
        } else {
          configurationsToCreate.push(config);
        }
      });

      if (configurationsToUpdate.length > 0) {
        const existingIds = configurationsToUpdate.map(config => config.id!);

        const existingConfigurations = await workflowConfigRepo.find({
          where: {
            id: In(existingIds),
            workflow: { id: workflowId },
          },
        });

        const existingConfigMap = new Map(
          existingConfigurations.map(config => [config.id, config]),
        );

        const nonExistentIds = existingIds.filter(
          id => !existingConfigMap.has(id),
        );

        if (nonExistentIds.length > 0) {
          throw new NotFoundException(
            `Configuration(s) with ID(s) '${nonExistentIds.join(', ')}' not found for workflow '${workflowId}'`,
          );
        }

        const configurationsToSave = configurationsToUpdate.map(
          configUpdate => {
            const { id, externalConnectionId, configuration, ...updateFields } =
              configUpdate;
            const existingConfig = existingConfigMap.get(id!)!;

            return manager.create(WorkflowConfiguration, {
              ...existingConfig,
              ...updateFields,
              id: id!,
              externalConnection: externalConnectionId
                ? { id: externalConnectionId }
                : existingConfig.externalConnection,
              configuration: {
                ...existingConfig.configuration,
                ...configuration,
              },
            });
          },
        );

        await workflowConfigRepo.save(configurationsToSave);
      }

      if (configurationsToCreate.length > 0) {
        const newConfigurations = configurationsToCreate.map(configData =>
          manager.create(WorkflowConfiguration, {
            ...configData,
            workflow,
            ...(configData.externalConnectionId
              ? {
                  externalConnection: {
                    id: configData.externalConnectionId,
                  },
                }
              : {}),
          }),
        );
        console.log('Saving configurations:', newConfigurations);
        await workflowConfigRepo.save(newConfigurations);
      }

      return workflowConfigRepo.find({
        where: { workflow: { id: workflowId } },
      });
    });
  }

  async getWorkflowConfigurations(
    workflowId: string,
  ): Promise<WorkflowConfiguration[]> {
    const where: FindOptionsWhere<Workflow> | FindOptionsWhere<Workflow>[] = {
      id: workflowId,
    };

    const workflow = await this.workflowRepository.findOne({
      where,
      relations: [
        'workflowConfigurations',
        'workflowConfigurations.workflow',
        'workflowConfigurations.externalConnection',
      ],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID '${workflowId}' not found`);
    }

    return workflow.workflowConfigurations || [];
  }

  async removeWorkflowConfiguration(
    configurationId: string,
    currentUser: User,
  ): Promise<void> {
    const result = await this.workflowConfigurationRepository.delete({
      id: configurationId,
      ...(currentUser.hasRole('super-admin')
        ? {}
        : {
            workflow: { createdBy: { id: currentUser.id } },
          }),
    });

    if (result.affected === 0) {
      throw new NotFoundException(
        `Configuration with ID '${configurationId}' not found`,
      );
    }

    this.logger.log(`Configuration '${configurationId}' removed successfully`);
  }
}
