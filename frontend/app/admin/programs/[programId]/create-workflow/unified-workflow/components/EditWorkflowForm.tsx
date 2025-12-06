'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  workflowControllerUpdateWorkflowBasicInfoMutation,
  fieldControllerUpsertWorkflowFieldsMutation,
  configurationControllerUpsertWorkflowConfigurationsMutation,
} from '@/client/@tanstack/react-query.gen';

import WorkflowDetailsStep from './WorkflowDetailsStep';
import DHIS2ConfigurationStep from './DHIS2ConfigurationStep';
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
  type: string;
  programId: string;
  orgUnits: string[];
  language: string;
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
}

interface EditWorkflowFormProps {
  workflowId: string;
  programId: string;
  existingWorkflow: Record<string, unknown>;
}

export default function EditWorkflowForm({
  workflowId,
  programId,
  existingWorkflow,
}: EditWorkflowFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isExternalMode, setIsExternalMode] = useState<boolean | null>(null);

  const [workflowData, setWorkflowData] = useState<WorkflowData>({
    name: '',
    description: '',
    inputType: 'text',
    supportedLanguages: ['en'],
  });

  const [externalConfig, setExternalConfig] = useState<ExternalConfig>({
    connectionId: '',
    type: '',
    programId: '',
    orgUnits: [],
    language: 'en',
  });

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
          : ['en'],
      });

      const externalConfiguration = Array.isArray(
        workflow.workflowConfigurations
      )
        ? (workflow.workflowConfigurations.find(
            (config: unknown) =>
              (config as Record<string, unknown>)?.type === 'dhis2'
          ) as Record<string, unknown> | undefined)
        : undefined;

      if (externalConfiguration) {
        setIsExternalMode(true);
        const config = externalConfiguration.configuration as
          | Record<string, unknown>
          | undefined;
        const externalConnection = externalConfiguration.externalConnection as
          | Record<string, unknown>
          | undefined;
        setExternalConfig({
          connectionId: (externalConnection?.id as string) || '',
          type: (config?.type as string) || 'program',
          programId: (config?.programId as string) || '',
          orgUnits: Array.isArray(config?.orgUnits)
            ? (config.orgUnits as string[])
            : [],
          language: (config?.language as string) || 'en',
        });
        setAiFields(
          Array.isArray(workflow.workflowFields)
            ? (workflow.workflowFields as AIField[])
            : []
        );
      } else {
        setIsExternalMode(false);
        setManualFields(
          Array.isArray(workflow.workflowFields)
            ? (workflow.workflowFields as ManualField[])
            : []
        );
      }
    }
  }, [existingWorkflow]);

  const maxSteps = isExternalMode ? 4 : isExternalMode === false ? 2 : 1;

  const handleExternalModeChange = () => {
    toast.error(
      'Cannot change integration mode when editing. Create a new workflow instead.'
    );
  };

  const handleExternalConfigChange = (newConfig: Partial<ExternalConfig>) => {
    const updatedConfig = { ...externalConfig, ...newConfig };

    if (
      newConfig.connectionId !== undefined ||
      newConfig.type !== undefined ||
      newConfig.programId !== undefined
    ) {
      setAiFields([]);
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
        return (
          isExternalMode === true &&
          !!externalConfig.connectionId &&
          !!externalConfig.programId
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
        const fieldsToUpsert = aiFields
          .filter((field) => isUUID(field.id))
          .map((field) => ({
            id: field.id,
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

        // Step 3: Upsert DHIS2 configurations
        await upsertConfigurationsMutation.mutateAsync({
          path: { workflowId },
          body: {
            configurations: [
              {
                type: 'dhis2',
                externalConnectionId: externalConfig.connectionId,
                configuration: {
                  programId: externalConfig.programId,
                  orgUnits: externalConfig.orgUnits,
                  language: externalConfig.language,
                },
                isActive: true,
              },
            ],
          } as unknown as undefined,
        });
      } else {
        const fieldsToUpsert = manualFields
          .filter((field) => isUUID(field.id))
          .map((field, index) => ({
            id: field.id,
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
      router.push(`/admin/programs/${programId}/create-workflow`);
    } catch (error) {
      console.error('Failed to update workflow:', error);
    }
  };

  const isLoading =
    updateBasicInfoMutation.isPending ||
    upsertFieldsMutation.isPending ||
    upsertConfigurationsMutation.isPending;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <button
            onClick={() =>
              router.push(`/admin/programs/${programId}/create-workflow`)
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

          {isExternalMode === true && currentStep === 2 && (
            <DHIS2ConfigurationStep
              config={externalConfig}
              onChange={handleExternalConfigChange}
            />
          )}

          {isExternalMode === true && currentStep === 3 && (
            <AIFieldMappingStep
              inputType={workflowData.inputType}
              fields={aiFields}
              setFields={setAiFields}
              externalConfig={externalConfig}
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
