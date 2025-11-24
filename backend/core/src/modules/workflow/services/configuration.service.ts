import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workflow, WorkflowConfiguration } from 'src/database/entities';
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

        const existingConfigIds = existingConfigurations.map(
          config => config.id,
        );
        const nonExistentIds = existingIds.filter(
          id => !existingConfigIds.includes(id),
        );

        if (nonExistentIds.length > 0) {
          throw new NotFoundException(
            `Configuration(s) with ID(s) '${nonExistentIds.join(', ')}' not found for workflow '${workflowId}'`,
          );
        }

        for (const configUpdate of configurationsToUpdate) {
          const { id, externalConnectionId, ...updateFields } = configUpdate;
          await manager.update(WorkflowConfiguration, id, {
            ...updateFields,
            ...(externalConnectionId
              ? {
                  externalConnection: {
                    id: externalConnectionId,
                  },
                }
              : {}),
          });
        }
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
