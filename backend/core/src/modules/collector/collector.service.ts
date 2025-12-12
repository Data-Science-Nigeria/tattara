import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  IntegrationType,
  ProcessingType,
  SubmissionStatus,
} from '@/common/enums';
import { ExtractedData } from '@/common/interfaces';
import { buildZodSchema, formatZodErrors } from '@/common/utils';
import {
  AiProcessingLog,
  ExternalConnection,
  FileUploads,
  Submission,
  User,
  Workflow,
  WorkflowField,
} from '@/database/entities';
import { DataSource, Repository } from 'typeorm';
import { RequestContext } from '@/shared/request-context/request-context.service';
import { AiService } from '../ai/ai.service';
import { ExtractionResponse } from '../ai/interfaces';
import { FileManagerService } from '../file-manager/file-manager.service';
import { IntegrationService } from '../integration/services';
import { WorkflowService } from '../workflow/services/workflow.service';
import { SubmitDto } from './dto/submit.dto';
import { ProcessAiPayload, ProcessAiResponse } from './interfaces';
import { format } from 'date-fns';

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
    private readonly requestContext: RequestContext,
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
        form_id: `${payload.workflowId}-${Date.now()}`,
        form_schema: { fields: formSchema },
        provider_preference: payload.aiProvider,
      };

      const language = payload.language ?? workflow.supportedLanguages[0];
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
        const { rows, ...rest } = response;

        const aiProcessingLog = manager.create(AiProcessingLog, {
          aiProvider: payload.aiProvider,
          confidenceScore: rest.confidence?.score ?? undefined,
          user,
          mappedOutput: rows as unknown as Record<string, unknown>,
          workflow,
          processingType: payload.processingType,
          formSchema: formSchema,
          completedAt: new Date(),
          processingTimeMs: rest.metrics?.total_seconds ?? undefined,
          metadata: rest,
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

        const dataEntries = submitData.dataEntries ?? [submitData.data!];

        const allExtractedData = dataEntries.map(data =>
          this.extractIntegrationData(workflow.workflowFields, data),
        );

        for (const config of workflow.workflowConfigurations) {
          if (config.type === IntegrationType.DHIS2) {
            for (const extractedData of allExtractedData) {
              if (
                workflow.workflowFields.length !==
                extractedData[IntegrationType.DHIS2]?.length
              ) {
                throw new BadRequestException(
                  `Field mappings for ${IntegrationType.DHIS2} missing`,
                );
              }
            }

            if (
              'program' in config.configuration &&
              !('schema' in config.configuration)
            ) {
              const programConfig = config.configuration as {
                program: string;
                programStage: string;
                orgUnit: string;
              };

              const eventPayloads = allExtractedData.map(extractedData => ({
                ...programConfig,
                program: programConfig.program,
                programStage: programConfig.programStage,
                eventDate: format(new Date(), 'yyyy-MM-dd'),
                status: 'ACTIVE',
                dataValues: extractedData[IntegrationType.DHIS2],
              }));

              await this.integrationService.pushData(config, eventPayloads);
            } else if ('dataset' in config.configuration) {
              const allDataValues = allExtractedData.flatMap(
                extractedData => extractedData[IntegrationType.DHIS2] ?? [],
              );

              const payload = {
                ...config.configuration,
                completeDate: format(new Date(), 'yyyy-MM-dd'),
                period: format(new Date(), 'yyyyMM'),
                dataValues: allDataValues,
              };

              await this.integrationService.pushData(config, payload);
            }
          }

          const sqlDatabaseTypes = [
            IntegrationType.POSTGRES,
            IntegrationType.MYSQL,
            IntegrationType.SQLITE,
            IntegrationType.MSSQL,
            IntegrationType.ORACLE,
          ];

          if (sqlDatabaseTypes.includes(config.type)) {
            const configType = config.type;
            for (const extractedData of allExtractedData) {
              const extractedDataRecord = extractedData;
              const fieldData = (extractedDataRecord[configType] ??
                []) as any[];
              if (workflow.workflowFields.length !== fieldData.length) {
                throw new BadRequestException(
                  `Field mappings for ${configType} missing`,
                );
              }
            }

            const rows = allExtractedData.map(extractedData => {
              const extractedDataRecord = extractedData as Record<string, any>;
              return (extractedDataRecord[configType] ?? []) as Array<
                Record<string, any>
              >;
            });

            const payload = {
              ...config.configuration,
              rows,
            };

            await this.integrationService.pushData(config, payload);
          }
        }

        const submissions = dataEntries.map(data =>
          manager.create(Submission, {
            status: SubmissionStatus.COMPLETED,
            user,
            workflow,
            submittedAt: new Date(),
            data,
            metadata: submitData.metadata,
            localId: submitData.localId,
          }),
        );

        await manager.save(submissions);

        return {
          message:
            submissions.length === 1
              ? 'Form submitted successfully'
              : `${submissions.length} forms submitted successfully`,
          count: submissions.length,
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
        'Submission failed with unknown error',
        JSON.stringify(error),
      );
      throw new InternalServerErrorException('Unknown error during Submission');
    }
  }

  /**
   * Get submission history with role-based scoping:
   * - Regular users: See only their own submissions
   * - Admins: See submissions from users they created
   * - Super-admins: See all submissions
   */
  async getSubmissionHistory(options?: {
    workflowId?: string;
    status?: SubmissionStatus;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const { workflowId, status, userId, page = 1, limit = 20 } = options || {};
    const currentUserId = this.requestContext.getUserId();
    const isSuperAdmin = this.requestContext.isSuperAdmin();
    const isAdmin = this.requestContext.isAdmin();

    const queryBuilder = this.submissionRepo
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.workflow', 'workflow')
      .leftJoinAndSelect('submission.user', 'user')
      .leftJoin('user.createdBy', 'userAdmin')
      .orderBy('submission.submittedAt', 'DESC');

    if (isSuperAdmin) {
      // No additional scoping needed
    } else if (isAdmin) {
      queryBuilder.andWhere(
        '(userAdmin.id = :adminId OR submission.user_id = :adminId)',
        { adminId: currentUserId },
      );
    } else {
      queryBuilder.andWhere('submission.user_id = :userId', {
        userId: currentUserId,
      });
    }

    if (workflowId) {
      queryBuilder.andWhere('submission.workflow_id = :workflowId', {
        workflowId,
      });
    }

    if (status) {
      queryBuilder.andWhere('submission.status = :status', { status });
    }

    // Allow admins/super-admins to filter by specific user
    if (userId && isAdmin) {
      queryBuilder.andWhere('submission.user_id = :filterUserId', {
        filterUserId: userId,
      });
    }

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [submissions, total] = await queryBuilder.getManyAndCount();

    return {
      data: submissions.map(s => ({
        ...s,
        user: s.user
          ? {
              id: s.user.id,
              email: s.user.email,
              firstName: s.user.firstName,
              lastName: s.user.lastName,
            }
          : null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single submission by ID with role-based scoping
   */
  async getSubmissionById(submissionId: string) {
    const currentUserId = this.requestContext.getUserId();
    const isSuperAdmin = this.requestContext.isSuperAdmin();
    const isAdmin = this.requestContext.isAdmin();

    const queryBuilder = this.submissionRepo
      .createQueryBuilder('submission')
      .leftJoinAndSelect('submission.workflow', 'workflow')
      .leftJoinAndSelect('workflow.workflowFields', 'workflowFields')
      .leftJoinAndSelect('submission.user', 'user')
      .leftJoin('user.createdBy', 'userAdmin')
      .where('submission.id = :submissionId', { submissionId });

    if (isSuperAdmin) {
      // No additional filters
    } else if (isAdmin) {
      queryBuilder.andWhere(
        '(userAdmin.id = :adminId OR submission.user_id = :adminId)',
        { adminId: currentUserId },
      );
    } else {
      queryBuilder.andWhere('submission.user_id = :userId', {
        userId: currentUserId,
      });
    }

    const submission = await queryBuilder.getOne();

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return {
      ...submission,
      user: submission.user
        ? {
            id: submission.user.id,
            email: submission.user.email,
            firstName: submission.user.firstName,
            lastName: submission.user.lastName,
          }
        : null,
    };
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

        const sqlDatabaseTypes = [
          IntegrationType.POSTGRES,
          IntegrationType.MYSQL,
          IntegrationType.SQLITE,
          IntegrationType.MSSQL,
          IntegrationType.ORACLE,
        ];

        if (sqlDatabaseTypes.includes(m.targetType)) {
          const entry = {
            table: m.target.table as string,
            column: m.target.column as string,
            value,
            type: f.fieldType,
            isNullable: f.isRequired ? false : true,
          };
          const existingEntries =
            (extractedData[m.targetType] as (typeof entry)[] | undefined) || [];
          extractedData[m.targetType] = [...existingEntries, entry];
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

      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation Failed',
        errors: formattedErrors,
      });
    } else {
      return true;
    }
  }
}
