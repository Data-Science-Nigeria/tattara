import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IntegrationType,
  ProcessingType,
  SubmissionStatus,
} from 'src/common/enums';
import { ExtractedData } from 'src/common/interfaces';
import { buildZodSchema, formatZodErrors } from 'src/common/utils';
import {
  AiProcessingLog,
  ExternalConnection,
  FileUploads,
  Submission,
  User,
  Workflow,
  WorkflowField,
} from 'src/database/entities';
import { DataSource, Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { ExtractionResponse } from '../ai/interfaces';
import { FileManagerService } from '../file-manager/file-manager.service';
import { IntegrationService } from '../integration/services';
import { WorkflowService } from '../workflow/services/workflow.service';
import { SubmitDto } from './dto/submit.dto';
import { ProcessAiPayload, ProcessAiResponse } from './interfaces';

@Injectable()
export class CollectorService {
  private readonly logger = new Logger(CollectorService.name);

  constructor(
    private readonly aiModuleService: AiService,
    private readonly workflowService: WorkflowService,
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,
    @InjectRepository(AiProcessingLog)
    private readonly aiProcessingLogRepo: Repository<AiProcessingLog>,
    @InjectRepository(FileUploads)
    private readonly fieldUploadRepo: Repository<FileUploads>,
    @InjectRepository(ExternalConnection)
    private readonly extConnectionRepo: Repository<ExternalConnection>,
    @InjectRepository(Submission)
    private readonly submissionRepo: Repository<Submission>,
    private readonly fileManagerService: FileManagerService,
    private readonly dataSource: DataSource,
    private readonly integrationService: IntegrationService,
  ) {
    fileManagerService.setStrategy('local');
  }

  async processAi(
    payload: ProcessAiPayload,
    user: User,
  ): Promise<ProcessAiResponse | null> {
    try {
      const { workflow, schema: formSchema } =
        await this.workflowService.findWorkflowByIdWithSchema(
          payload.workflowId,
        );

      const aiRequestPayload = {
        form_id: workflow.name,
        form_schema: { fields: formSchema },
        provider_preference: payload.aiProvider,
      };

      const language = workflow.supportedLanguages[0];
      let response: ExtractionResponse | null = null;

      switch (payload.processingType) {
        case ProcessingType.AUDIO:
          if (!payload.files || payload.files.length < 1)
            throw new BadRequestException(
              'Audio file is required for AUDIO processing',
            );
          response = await this.aiModuleService.processAudio({
            ...aiRequestPayload,
            language,
            audio_file: payload.files[0].buffer,
          });
          break;

        case ProcessingType.IMAGE:
          if (!payload.files || payload.files.length < 1)
            throw new BadRequestException(
              'Image file is required for IMAGE processing',
            );
          response = await this.aiModuleService.processImage({
            ...aiRequestPayload,
            language,
            images: payload.files,
          });
          break;

        case ProcessingType.TEXT:
          if (!payload.text)
            throw new BadRequestException(
              'Text input is required for TEXT processing',
            );
          response = await this.aiModuleService.processText({
            ...aiRequestPayload,
            text: payload.text,
          });
          break;

        default: {
          throw new BadRequestException(
            `Unsupported processing type: ${payload.processingType as string}`,
          );
        }
      }

      return await this.dataSource.transaction(async manager => {
        const aiProcessingLog = manager.create(AiProcessingLog, {
          aiProvider: payload.aiProvider,
          confidenceScore: response.confidence?.score ?? undefined,
          user,
          mappedOutput: response.extracted,
          workflow,
          processingType: payload.processingType,
          formSchema: formSchema,
          completedAt: new Date(),
          processingTimeMs: response.metrics?.total_seconds ?? undefined,
          metadata: response.metrics,
        });

        let savedLog: AiProcessingLog;

        if (payload.files && payload.files.length > 0) {
          const uploadedFiles: FileUploads[] = [];

          for (const f of payload.files) {
            const file = await this.fileManagerService.upload(f);
            uploadedFiles.push(file);
          }

          aiProcessingLog.inputFileIds = uploadedFiles.map(f => f.id);
          savedLog = await manager.save(aiProcessingLog);

          for (const file of uploadedFiles) {
            file.aiProcessingLogId = savedLog.id;
            file.user = user;
            file.isProcessed = true;
            await manager.save(file);
          }
        } else {
          if (payload.text) {
            aiProcessingLog.inputText = payload.text;
          }
          savedLog = await manager.save(aiProcessingLog);
        }

        return {
          aiData: response,
          aiProcessingLogId: savedLog.id,
        };
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `AI processing failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
      this.logger.error(
        'AI processing failed with unknown error',
        JSON.stringify(error),
      );
      throw new InternalServerErrorException(
        'Unknown error during AI processing',
      );
    }
  }

  async submit(submitData: SubmitDto, user: User) {
    try {
      return this.dataSource.transaction(async manager => {
        const workflow = await this.workflowService.findWorkflowById(
          submitData.workflowId,
        );

        if (
          workflow.workflowConfigurations.length > 0 &&
          workflow.fieldMappings.length < 1
        ) {
          throw new BadRequestException('Field Mappings not set');
        }

        const extractedIntegrationData = this.extractIntegrationData(
          workflow.workflowFields,
          submitData.data,
        );

        console.log(
          'length',
          workflow.workflowFields.length,
          extractedIntegrationData.postgres?.length,
        );

        // return;

        // console.log('extractedIntegrationData', extractedIntegrationData);

        for (const config of workflow.workflowConfigurations) {
          let payload: unknown;

          // if (config.type === IntegrationType.DHIS2) {
          //   if (
          //     workflow.workflowFields.length !==
          //     extractedIntegrationData[IntegrationType.DHIS2]?.length
          //   ) {
          //     throw new BadRequestException(
          //       `Field mappings for ${IntegrationType.DHIS2} missing`,
          //     );
          //   }
          //   if ('program' in config.configuration) {
          //     payload = {
          //       ...config.configuration,
          //       eventDate: format(new Date(), 'yyyy-MM-dd'),
          //       status: 'COMPLETED',
          //       dataValues: extractedIntegrationData[IntegrationType.DHIS2],
          //     };
          //   } else if ('dataset' in config.configuration) {
          //     payload = {
          //       ...config.configuration,
          //       completeDate: format(new Date(), 'yyyy-MM-dd'),
          //       period: format(new Date(), 'yyyyMM'),
          //       dataValues: extractedIntegrationData[IntegrationType.DHIS2],
          //     };
          //   }

          //   const resDhis = await this.integrationService.pushData(
          //     config,
          //     payload,
          //   );

          //   console.log(resDhis);
          // }

          if (config.type === IntegrationType.POSTGRES) {
            if (
              workflow.workflowFields.length !==
              extractedIntegrationData[IntegrationType.POSTGRES]?.length
            ) {
              throw new BadRequestException(
                `Field mappings for ${IntegrationType.POSTGRES} missing`,
              );
            }

            if ('schema' in config.configuration) {
              payload = {
                ...config.configuration,
                dataValues: extractedIntegrationData[IntegrationType.DHIS2],
              };
            }

            const resDhis = await this.integrationService.pushData(
              config,
              payload,
            );
            console.log(resDhis);
          }
        }

        const submission = manager.create(Submission, {
          status: SubmissionStatus.COMPLETED,
          user,
          workflow,
          submittedAt: new Date(),
          data: submitData.data,
        });

        await manager.save(submission);
      });
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(
          `AI processing failed: ${error.message}`,
          error.stack,
        );
        throw error;
      }
      this.logger.error(
        'Submission failed with unknown error',
        JSON.stringify(error),
      );
      throw new InternalServerErrorException('Unknown error during Submission');
    }
  }

  private extractIntegrationData(
    fields: WorkflowField[],
    data: Record<string, any>,
  ): ExtractedData {
    this.validateForm(fields, data);

    const extractedData: ExtractedData = {};

    fields.forEach(f => {
      f.fieldMappings.forEach(m => {
        const value = data[f.fieldName] as string;

        if (m.targetType === IntegrationType.DHIS2) {
          const entry = {
            dataElement: m.target.dataElement as string,
            value,
          };
          extractedData[m.targetType] = [
            ...(extractedData[m.targetType] || []),
            entry,
          ];
        }

        if (m.targetType === IntegrationType.POSTGRES) {
          const entry = {
            table: m.target.table as string,
            column: m.target.column as string,
            value,
          };
          extractedData[m.targetType] = [
            ...(extractedData[m.targetType] || []),
            entry,
          ];
        }
      });
    });

    return extractedData;
  }

  private validateForm(fields: WorkflowField[], data: Record<string, any>) {
    const formDefinition = fields.map(f => ({
      fieldName: f.fieldName,
      label: f.label,
      isRequired: f.isRequired,
      fieldType: f.fieldType,
      options: f.options,
      validationRules: f.validationRules,
      fieldMapping: f.fieldMappings,
    }));

    const schema = buildZodSchema(formDefinition);
    const result = schema.safeParse(data);

    if (!result.success) {
      const formattedErrors = formatZodErrors(result.error.issues);

      this.logger.log(
        `❌ Validation failed: ${JSON.stringify(formattedErrors, null, 2)}`,
      );

      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation Failed',
        errors: formattedErrors,
      });
    } else {
      this.logger.log(`✅ Valid data: ${JSON.stringify(result.data)}`);
      return true;
    }
  }
}
