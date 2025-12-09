'use client';

import { useState } from 'react';
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
import EditWorkflowForm from './components/EditWorkflowForm';

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
  programStageId?: string;
  datasetId?: string;
  orgUnit: string;
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

export default function UnifiedWorkflow() {
  const params = useParams();
  const searchParams = useSearchParams();
  const programId = params.programId as string;
  const workflowId = searchParams.get('workflowId');
  const isEditMode = !!workflowId;

  // Load existing workflow data if editing
  const { data: existingWorkflow, isLoading: isLoadingWorkflow } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: isEditMode,
  });

  // If in edit mode, render EditWorkflowForm
  if (isEditMode) {
    if (isLoadingWorkflow) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
      );
    }

    if (!existingWorkflow) {
      return (
        <div className="flex min-h-screen items-center justify-center">
          <p className="text-red-600">Workflow not found</p>
        </div>
      );
    }

    return (
      <EditWorkflowForm
        workflowId={workflowId}
        programId={programId}
        existingWorkflow={existingWorkflow}
      />
    );
  }

  // Create mode - continue with existing logic
  return <CreateWorkflowContent programId={programId} />;
}

function CreateWorkflowContent({ programId }: { programId: string }) {
  const router = useRouter();
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
    type: '',
    programId: '',
    programStageId: '',
    datasetId: '',
    orgUnit: '',
  });

  const [aiFields, setAiFields] = useState<AIField[]>([]);
  const [manualFields, setManualFields] = useState<ManualField[]>([]);

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
          programStageId: '',
          datasetId: '',
          orgUnit: '',
        });
        setAiFields([]);
      }
    }
  };

  const handleExternalConfigChange = (newConfig: Partial<ExternalConfig>) => {
    const updatedConfig = { ...externalConfig, ...newConfig };

    // Clear AI fields if connection, type, program, or dataset changes
    if (
      newConfig.connectionId !== undefined ||
      newConfig.type !== undefined ||
      newConfig.programId !== undefined ||
      newConfig.datasetId !== undefined
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
          (externalConfig.type === 'program'
            ? !!externalConfig.programId && !!externalConfig.programStageId
            : !!externalConfig.datasetId) &&
          !!externalConfig.orgUnit
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
            options: field.options,
          })),
          workflowConfigurations: [
            {
              type: 'dhis2' as const,
              externalConnectionId: externalConfig.connectionId,
              configuration:
                externalConfig.type === 'program'
                  ? {
                      program: externalConfig.programId,
                      programStage: externalConfig.programStageId,
                      orgUnit: externalConfig.orgUnit,
                    }
                  : {
                      dataSet: externalConfig.datasetId,
                      orgUnit: externalConfig.orgUnit,
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
            Create Workflow
          </h1>
          <p className="text-gray-600">
            Set up your AI-powered data collection workflow
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
              isEditMode={false}
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
