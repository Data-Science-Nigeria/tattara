import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workflow, WorkflowConfiguration } from '@/database/entities';
import { DataSource, In, Repository } from 'typeorm';
import { UpdateConfigurationDto } from '../dto';

@Injectable()
export class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowConfiguration)
    private workflowConfigurationRepository: Repository<WorkflowConfiguration>,
    private dataSource: DataSource,
  ) {}

  async upsertWorkflowConfigurations(
    workflowId: string,
    configurationsData: UpdateConfigurationDto[],
  ): Promise<WorkflowConfiguration[]> {
    if (!configurationsData.length) {
      throw new BadRequestException('Configuration data cannot be empty');
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
        const existingConfigurations = await manager.find(
          WorkflowConfiguration,
          {
            where: {
              id: In(existingIds),
              workflow: { id: workflowId },
            },
          },
        );

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

        await manager.save(WorkflowConfiguration, configurationsToSave);
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
        await manager.save(newConfigurations);
      }

      return manager.find(WorkflowConfiguration, {
        where: { workflow: { id: workflowId } },
        order: { createdAt: 'ASC' },
      });
    });
  }

  async getWorkflowConfigurations(
    workflowId: string,
  ): Promise<WorkflowConfiguration[]> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
      relations: ['workflowConfigurations'],
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID '${workflowId}' not found`);
    }

    return workflow.workflowConfigurations || [];
  }

  async removeWorkflowConfiguration(configurationId: string): Promise<void> {
    const result =
      await this.workflowConfigurationRepository.delete(configurationId);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Configuration with ID '${configurationId}' not found`,
      );
    }

    this.logger.log(`Configuration '${configurationId}' removed successfully`);
  }
}
