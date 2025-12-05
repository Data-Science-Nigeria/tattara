'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  workflowControllerCreateWorkflowMutation,
  workflowControllerFindWorkflowByIdOptions,
} from '@/client/@tanstack/react-query.gen';

import WorkflowDetailsStep from './components/WorkflowDetailsStep';
import DHIS2ConfigurationStep from './components/DHIS2ConfigurationStep';
import AIFieldMappingStep from './components/AIFieldMappingStep';
import ManualFieldStep from './components/ManualFieldStep';
import CreateWorkflowStep from './components/CreateWorkflowStep';
import StepIndicator from './components/StepIndicator';

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

export default function UnifiedWorkflow() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const programId = params.programId as string;
  const workflowId = searchParams.get('workflowId');
  const isEditMode = !!workflowId;

  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  const [isExternalMode, setIsExternalMode] = useState<boolean | null>(null);

  // Data states
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

  // Load existing workflow data if editing
  const { data: existingWorkflow } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: isEditMode,
  });

  const createWorkflowMutation = useMutation({
    ...workflowControllerCreateWorkflowMutation(),
    onSuccess: () => {
      toast.success('Workflow created successfully!');
      router.push(`/admin/programs/${programId}/create-workflow`);
    },
    onError: (error) => {
      console.error('Failed to create workflow:', error);
      toast.error('Failed to create workflow');
    },
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (existingWorkflow && isEditMode) {
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
          setExternalConfig({
            connectionId:
              (externalConfiguration.externalConnectionId as string) || '',
            type: (config?.type as string) || '',
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
    }
  }, [existingWorkflow, isEditMode]);

  const maxSteps = isExternalMode ? 4 : isExternalMode === false ? 2 : 1;

  const handleExternalModeChange = (
    useExternal: boolean,
    connectionId?: string
  ) => {
    if (isExternalMode !== useExternal) {
      setIsExternalMode(useExternal);
      // Clear data when switching modes
      if (useExternal) {
        setManualFields([]);
        if (connectionId) {
          setExternalConfig((prev) => ({ ...prev, connectionId }));
        }
      } else {
        setExternalConfig({
          connectionId: '',
          type: '',
          programId: '',
          orgUnits: [],
          language: 'en',
        });
        setAiFields([]);
      }
    }
  };

  const handleExternalConfigChange = (newConfig: Partial<ExternalConfig>) => {
    const updatedConfig = { ...externalConfig, ...newConfig };

    // Clear AI fields if connection, type, or program changes
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

  const handleSubmit = async () => {
    if (isExternalMode) {
      // DHIS2 workflow creation
      await createWorkflowMutation.mutateAsync({
        body: {
          programId: programId || undefined,
          name: workflowData.name,
          description: workflowData.description,
          supportedLanguages: workflowData.supportedLanguages,
          enabledModes: [workflowData.inputType],
          workflowFields: aiFields.map((field) => ({
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
          })),
          workflowConfigurations: [
            {
              type: 'dhis2' as const,
              externalConnectionId: externalConfig.connectionId,
              configuration: {
                programId: externalConfig.programId,
                orgUnits: externalConfig.orgUnits,
                language: externalConfig.language,
              },
              isActive: true as boolean,
            },
          ],
        },
      });
    } else {
      // Manual workflow creation
      await createWorkflowMutation.mutateAsync({
        body: {
          programId: programId || undefined,
          name: workflowData.name,
          description: workflowData.description,
          supportedLanguages: workflowData.supportedLanguages,
          enabledModes: [workflowData.inputType],
          workflowFields: manualFields.map((field, index) => ({
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
          })),
          workflowConfigurations: [],
        },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
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
            {isEditMode ? 'Edit Workflow' : 'Create Workflow'}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? 'Update your workflow configuration'
              : 'Set up your AI-powered data collection workflow'}
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          maxSteps={maxSteps}
          isExternalMode={isExternalMode}
          onStepClick={goToStep}
          canProceedToStep={canProceedToStep}
        />

        {/* Step Content */}
        <div className="mt-8 rounded-lg bg-white p-8 shadow-sm">
          {currentStep === 1 && (
            <WorkflowDetailsStep
              workflowData={workflowData}
              setWorkflowData={setWorkflowData}
              isExternalMode={isExternalMode}
              onExternalModeChange={handleExternalModeChange}
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
              isLoading={createWorkflowMutation.isPending}
            />
          )}

          {isExternalMode === false && currentStep === 2 && (
            <ManualFieldStep
              inputType={workflowData.inputType}
              fields={manualFields}
              setFields={setManualFields}
              onSubmit={handleSubmit}
              isLoading={createWorkflowMutation.isPending}
            />
          )}
        </div>

        {/* Navigation */}
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
