'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  workflowControllerUpdateWorkflowBasicInfoMutation,
  fieldControllerUpsertWorkflowFieldsMutation,
  fieldControllerRemoveWorkflowFieldMutation,
  configurationControllerUpsertWorkflowConfigurationsMutation,
  programControllerFindWorkflowsByProgramQueryKey,
  workflowControllerFindWorkflowByIdQueryKey,
} from '@/client/@tanstack/react-query.gen';

import WorkflowDetailsStep from './WorkflowDetailsStep';
import DHIS2ConfigurationStep from './DHIS2ConfigurationStep';
import PostgresConfigurationStep from './PostgresConfigurationStep';
import AIFieldMappingStep from './AIFieldMappingStep';
import ManualFieldStep from './ManualFieldStep';
import CreateWorkflowStep from './CreateWorkflowStep';
import StepIndicator from './StepIndicator';

interface WorkflowData {
  name: string;
  description: string;
  inputType: 'text' | 'audio' | 'image';
  supportedLanguages: string[];
}

interface ExternalConfig {
  connectionId: string;
  connectionType?: string;
  type: string;
  programId: string;
  programStageId?: string;
  datasetId?: string;
  orgUnit: string;
  schema?: string;
  table?: string;
}

interface AIField {
  id: string;
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  aiPrompt: string;
  externalDataElement?: string;
  options?: string[];
}

interface ManualField {
  id: string;
  name: string;
  label: string;
  type: string;
  description: string;
  required: boolean;
  options?: string[];
  externalDataElement?: string;
}

interface EditWorkflowFormProps {
  workflowId: string;
  programId: string;
  existingWorkflow: Record<string, unknown>;
  isStandalone?: boolean;
}

export default function EditWorkflowForm({
  workflowId,
  programId,
  existingWorkflow,
  isStandalone = false,
}: EditWorkflowFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [isExternalMode, setIsExternalMode] = useState<boolean | null>(null);

  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    name: '',
    description: '',
    inputType: 'text',
    supportedLanguages: ['English'],
  });

  const [externalConfig, setExternalConfig] = useState<ExternalConfig>({
    connectionId: '',
    connectionType: '',
    type: '',
    programId: '',
    programStageId: '',
    datasetId: '',
    orgUnit: '',
    schema: '',
    table: '',
  });

  const [existingConfigId, setExistingConfigId] = useState<string | null>(null);

  const [aiFields, setAiFields] = useState<AIField[]>([]);
  const [manualFields, setManualFields] = useState<ManualField[]>([]);

  // Update mutations
  const updateBasicInfoMutation = useMutation({
    ...workflowControllerUpdateWorkflowBasicInfoMutation(),
    onError: (error) => {
      console.error('Failed to update workflow basic info:', error);
      toast.error('Failed to update workflow basic info');
    },
  });

  const upsertFieldsMutation = useMutation({
    ...fieldControllerUpsertWorkflowFieldsMutation(),
    onError: (error) => {
      console.error('Failed to update workflow fields:', error);
      toast.error('Failed to update workflow fields');
    },
  });

  const upsertConfigurationsMutation = useMutation({
    ...configurationControllerUpsertWorkflowConfigurationsMutation(),
    onError: (error) => {
      console.error('Failed to update workflow configurations:', error);
      toast.error('Failed to update workflow configurations');
    },
  });

  const deleteFieldMutation = useMutation({
    ...fieldControllerRemoveWorkflowFieldMutation(),
    onSuccess: () => {
      toast.success('Field deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete field:', error);
      toast.error('Failed to delete field');
    },
  });

  // Load existing workflow data
  useEffect(() => {
    const workflow = (existingWorkflow as { data?: Record<string, unknown> })
      ?.data;
    if (workflow) {
      setWorkflowData({
        name: (workflow.name as string) || '',
        description: (workflow.description as string) || '',
        inputType:
          (Array.isArray(workflow.enabledModes)
            ? (workflow.enabledModes[0] as 'text' | 'audio' | 'image')
            : 'text') || 'text',
        supportedLanguages: Array.isArray(workflow.supportedLanguages)
          ? (workflow.supportedLanguages as string[])
          : ['English'],
      });

      const externalConfiguration = Array.isArray(
        workflow.workflowConfigurations
      )
        ? (workflow.workflowConfigurations.find((config: unknown) => {
            const configType = (config as Record<string, unknown>)?.type;
            return (
              configType === 'dhis2' ||
              configType === 'postgres' ||
              configType === 'mysql'
            );
          }) as Record<string, unknown> | undefined)
        : undefined;

      // Build field mappings lookup from fieldMappings array
      const fieldMappings = Array.isArray(workflow.fieldMappings)
        ? (workflow.fieldMappings as Array<Record<string, unknown>>)
        : [];
      const mappingsByFieldId = new Map<string, string>();
      fieldMappings.forEach((mapping) => {
        const fieldId = (mapping.workflowField as Record<string, unknown>)
          ?.id as string;
        const dataElement =
          ((mapping.target as Record<string, unknown>)
            ?.dataElement as string) || '';
        if (fieldId && dataElement) {
          mappingsByFieldId.set(fieldId, dataElement);
        }
      });

      if (externalConfiguration) {
        setIsExternalMode(true);
        setExistingConfigId((externalConfiguration.id as string) || null);
        const config = externalConfiguration.configuration as
          | Record<string, unknown>
          | undefined;
        const externalConnection = externalConfiguration.externalConnection as
          | Record<string, unknown>
          | undefined;
        const connType =
          (externalConfiguration.type as string) ||
          (externalConnection?.type as string) ||
          'dhis2';
        // Determine type based on configuration properties
        const configType = config?.dataSet
          ? 'dataset'
          : config?.schema
            ? connType === 'mysql'
              ? 'mysql'
              : 'postgres'
            : 'program';

        setExternalConfig({
          connectionId: (externalConnection?.id as string) || '',
          connectionType: connType,
          type: configType,
          programId: ((config?.program || config?.programId) as string) || '',
          programStageId: (config?.programStage as string) || '',
          datasetId: (config?.dataSet as string) || '',
          orgUnit:
            ((config?.orgUnit ||
              (Array.isArray(config?.orgUnits)
                ? config.orgUnits[0]
                : '')) as string) || '',
          schema: (config?.schema as string) || '',
          table: (config?.table as string) || '',
        });
        const existingFields = Array.isArray(workflow.workflowFields)
          ? (workflow.workflowFields as Array<Record<string, unknown>>)
          : [];
        setAiFields(
          existingFields.map((field) => {
            const fieldId = (field.id as string) || '';
            return {
              id: fieldId,
              fieldName: (field.fieldName as string) || '',
              label: (field.label as string) || '',
              fieldType: (field.fieldType as string) || 'text',
              isRequired: (field.isRequired as boolean) || false,
              displayOrder: (field.displayOrder as number) || 0,
              aiPrompt:
                ((field.aiMapping as Record<string, unknown>)
                  ?.prompt as string) || '',
              externalDataElement:
                mappingsByFieldId.get(fieldId) ||
                (field.externalDataElement as string) ||
                '',
              options: (field.options as string[]) || undefined,
            };
          })
        );
      } else {
        setIsExternalMode(false);
        const existingFields = Array.isArray(workflow.workflowFields)
          ? (workflow.workflowFields as Array<Record<string, unknown>>)
          : [];
        setManualFields(
          existingFields.map((field) => {
            const fieldId = (field.id as string) || '';
            return {
              id: fieldId,
              name: (field.fieldName as string) || '',
              label: (field.label as string) || '',
              type: (field.fieldType as string) || 'text',
              description:
                ((field.aiMapping as Record<string, unknown>)
                  ?.prompt as string) || '',
              required: (field.isRequired as boolean) || false,
              options: (field.options as string[]) || undefined,
              externalDataElement:
                mappingsByFieldId.get(fieldId) ||
                (field.externalDataElement as string) ||
                '',
            };
          })
        );
      }
    }
  }, [existingWorkflow]);

  const maxSteps = isExternalMode ? 4 : isExternalMode === false ? 2 : 1;

  const handleExternalModeChange = (
    useExternal: boolean,
    connectionId?: string,
    connectionType?: string
  ) => {
    // Only allow changing from manual to external, not the reverse
    if (isExternalMode === true) {
      toast.error(
        'Cannot remove external integration. Create a new workflow instead.'
      );
      return;
    }

    // Allow upgrading from manual to external
    if (useExternal && connectionId) {
      // Convert manual fields to AI fields, preserving IDs and external mappings
      const convertedFields: AIField[] = manualFields.map((field, index) => ({
        id: field.id,
        fieldName: field.name,
        label: field.label,
        fieldType: field.type,
        isRequired: field.required,
        displayOrder: index + 1,
        aiPrompt:
          field.description ||
          `Extract ${field.label.toLowerCase()} from the input`,
        externalDataElement: field.externalDataElement || '',
        options: field.options,
      }));

      setIsExternalMode(true);
      setExternalConfig((prev) => ({ ...prev, connectionId, connectionType }));
      setAiFields(convertedFields);
      setManualFields([]);
    }
  };

  const handleExternalConfigChange = (newConfig: Partial<ExternalConfig>) => {
    const updatedConfig = { ...externalConfig, ...newConfig };

    // Check if config actually changed (not just set to same value)
    const configChanged =
      (newConfig.connectionId !== undefined &&
        newConfig.connectionId !== externalConfig.connectionId) ||
      (newConfig.type !== undefined &&
        newConfig.type !== externalConfig.type) ||
      (newConfig.programId !== undefined &&
        newConfig.programId !== externalConfig.programId) ||
      (newConfig.datasetId !== undefined &&
        newConfig.datasetId !== externalConfig.datasetId);

    if (configChanged) {
      // Keep fields with IDs but clear their external mappings (need to remap)
      setAiFields((prev) =>
        prev
          .filter((field) => isUUID(field.id))
          .map((field) => ({ ...field, externalDataElement: '' }))
      );
    }

    setExternalConfig(updatedConfig);
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= maxSteps) {
      setCurrentStep(step);
    }
  };

  const validateTextContent = (text: string): boolean => {
    const textChars = text.replace(/[^a-zA-Z]/g, '').length;
    const numberChars = text.replace(/[^0-9]/g, '').length;
    return textChars > numberChars;
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        if (isExternalMode === null) return false;
        return (
          workflowData.name.trim() !== '' &&
          workflowData.name.trim().length >= 8 &&
          validateTextContent(workflowData.name) &&
          workflowData.description.trim() !== '' &&
          workflowData.description.trim().length >= 15 &&
          validateTextContent(workflowData.description) &&
          workflowData.supportedLanguages.length > 0
        );
      case 3:
        if (isExternalMode !== true || !externalConfig.connectionId)
          return false;
        if (
          externalConfig.connectionType === 'postgres' ||
          externalConfig.connectionType === 'mysql'
        ) {
          return !!externalConfig.schema && !!externalConfig.table;
        }
        return (
          (externalConfig.type === 'program'
            ? !!externalConfig.programId && !!externalConfig.programStageId
            : !!externalConfig.datasetId) && !!externalConfig.orgUnit
        );
      case 4:
        return isExternalMode === true && aiFields.length > 0;
      default:
        return false;
    }
  };

  const isUUID = (id: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const handleSubmit = async () => {
    try {
      // Step 1: Update basic workflow info
      await updateBasicInfoMutation.mutateAsync({
        path: { workflowId },
        body: {
          name: workflowData.name,
          description: workflowData.description,
          supportedLanguages: workflowData.supportedLanguages,
          enabledModes: [workflowData.inputType],
        },
      });

      // Step 2: Upsert workflow fields
      if (isExternalMode) {
        const fieldsToUpsert = aiFields.map((field) => ({
          ...(isUUID(field.id) ? { id: field.id } : {}),
          fieldName: field.fieldName,
          label: field.label,
          fieldType: field.fieldType as
            | 'text'
            | 'number'
            | 'date'
            | 'datetime'
            | 'select'
            | 'multiselect'
            | 'boolean'
            | 'email'
            | 'phone'
            | 'url'
            | 'textarea',
          isRequired: field.isRequired,
          displayOrder: field.displayOrder,
          aiMapping: { prompt: field.aiPrompt },
          options: field.options,
        }));

        await upsertFieldsMutation.mutateAsync({
          path: { workflowId },
          body: { fields: fieldsToUpsert },
        });

        // Step 3: Upsert external configurations (DHIS2 or Postgres)
        await upsertConfigurationsMutation.mutateAsync({
          path: { workflowId },
        });
      } else {
        const fieldsToUpsert = manualFields.map((field, index) => ({
          ...(isUUID(field.id) ? { id: field.id } : {}),
          fieldName: field.name,
          label: field.label,
          fieldType: field.type.toLowerCase() as
            | 'text'
            | 'number'
            | 'date'
            | 'datetime'
            | 'select'
            | 'multiselect'
            | 'boolean'
            | 'email'
            | 'phone'
            | 'url'
            | 'textarea',
          isRequired: field.required,
          displayOrder: index + 1,
          aiMapping: {
            prompt:
              field.description ||
              `Extract ${field.label.toLowerCase()} from the ${workflowData.inputType} input`,
          },
          options: field.options,
        }));

        await upsertFieldsMutation.mutateAsync({
          path: { workflowId },
          body: { fields: fieldsToUpsert },
        });
      }

      toast.success('Workflow updated successfully!');
      if (!isStandalone && programId) {
        await queryClient.invalidateQueries({
          queryKey: programControllerFindWorkflowsByProgramQueryKey({
            path: { id: programId },
          }),
        });
      }
      await queryClient.invalidateQueries({
        queryKey: workflowControllerFindWorkflowByIdQueryKey({
          path: { workflowId },
        }),
      });
      router.push(
        isStandalone
          ? '/admin/workflows'
          : `/admin/programs/${programId}/create-workflow`
      );
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    if (!isUUID(fieldId)) {
      // For new fields (non-UUID), just remove from state
      if (isExternalMode) {
        setAiFields((prev) => prev.filter((f) => f.id !== fieldId));
      } else {
        setManualFields((prev) => prev.filter((f) => f.id !== fieldId));
      }
      return;
    }

    try {
      await deleteFieldMutation.mutateAsync({
        path: { fieldId },
      });

      // Remove from state after successful deletion
      if (isExternalMode) {
        setAiFields((prev) => prev.filter((f) => f.id !== fieldId));
      } else {
        setManualFields((prev) => prev.filter((f) => f.id !== fieldId));
      }
    } catch (error) {
      console.error('Failed to delete field:', error);
    }
  };

  const isLoading =
    updateBasicInfoMutation.isPending ||
    upsertFieldsMutation.isPending ||
    upsertConfigurationsMutation.isPending ||
    deleteFieldMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() =>
              router.push(
                isStandalone
                  ? '/admin/workflows'
                  : `/admin/programs/${programId}/create-workflow`
              )
            }
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={20} />
            Back to Workflows
          </button>
          <h1 className="text-3xl font-semibold text-gray-900">
            Edit Workflow
          </h1>
          <p className="text-gray-600">Update your workflow configuration</p>
        </div>

        <StepIndicator
          currentStep={currentStep}
          maxSteps={maxSteps}
          isExternalMode={isExternalMode}
          onStepClick={goToStep}
          canProceedToStep={canProceedToStep}
        />

        <div className="mt-8 rounded-lg bg-white p-8 shadow-sm">
          {currentStep === 1 && (
            <WorkflowDetailsStep
              workflowData={workflowData}
              setWorkflowData={setWorkflowData}
              isExternalMode={isExternalMode}
              onExternalModeChange={handleExternalModeChange}
              isEditMode={true}
            />
          )}

          {isExternalMode === true &&
            currentStep === 2 &&
            (externalConfig.connectionType === 'postgres' ||
            externalConfig.connectionType === 'mysql' ? (
              <PostgresConfigurationStep
                config={{
                  connectionId: externalConfig.connectionId,
                  schema: externalConfig.schema || '',
                  table: externalConfig.table || '',
                }}
                onChange={handleExternalConfigChange}
                isEditMode={true}
              />
            ) : (
              <DHIS2ConfigurationStep
                config={externalConfig}
                onChange={handleExternalConfigChange}
                isEditMode={true}
              />
            ))}

          {isExternalMode === true && currentStep === 3 && (
            <AIFieldMappingStep
              inputType={workflowData.inputType}
              fields={aiFields}
              setFields={setAiFields}
              externalConfig={externalConfig}
              isEditMode={true}
              onDeleteField={handleDeleteField}
            />
          )}

          {isExternalMode === true && currentStep === 4 && (
            <CreateWorkflowStep
              workflowData={workflowData}
              externalConfig={externalConfig}
              aiFields={aiFields}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isEditMode={true}
            />
          )}

          {isExternalMode === false && currentStep === 2 && (
            <ManualFieldStep
              inputType={workflowData.inputType}
              fields={manualFields}
              setFields={setManualFields}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              isEditMode={true}
              onDeleteField={handleDeleteField}
            />
          )}
        </div>

        <div className="mt-8 flex justify-between">
          <button
            onClick={() => goToStep(currentStep - 1)}
            disabled={currentStep === 1}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>

          {currentStep < maxSteps && (
            <button
              onClick={() => goToStep(currentStep + 1)}
              disabled={!canProceedToStep(currentStep + 1)}
              className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
