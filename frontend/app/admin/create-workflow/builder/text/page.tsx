'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import {
  workflowControllerCreateWorkflowMutation,
  workflowControllerFindWorkflowByIdOptions,
  configurationControllerUpsertWorkflowConfigurationsMutation,
  fieldControllerUpsertWorkflowFieldsMutation,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import WorkflowBuilderLayout from '../components/workflow-builder-layout';
import DHIS2ConfigStep from '../components/dhis2-config-step';
import FieldPreviewModal from '../components/field-preview-modal';
import AiFieldMappingSection from '../components/AiFieldMappingSection';

export default function TextBuilder() {
  const searchParams = useSearchParams();

  // Get workflow data from URL params
  const programId = searchParams.get('programId');
  const workflowId = searchParams.get('workflowId');
  const name = searchParams.get('name');
  const description = searchParams.get('description');
  const supportedLanguages = searchParams
    .get('supportedLanguages')
    ?.split(',') || ['en'];

  const isEditMode = !!workflowId;

  const [currentStep, setCurrentStep] = useState<'config' | 'text' | 'create'>(
    'config'
  );

  const [showFieldPreview, setShowFieldPreview] = useState(false);

  // DHIS2 Configuration
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([]);

  // Clear AI fields when DHIS2 config changes
  useEffect(() => {
    setAiFieldMappings([]);
  }, [selectedConnection, selectedType, selectedProgram]);

  // Basic Configuration
  const [basicConfig, setBasicConfig] = useState({
    language: 'en',
  });

  // AI Field Mapping
  const [aiFieldMappings, setAiFieldMappings] = useState<
    Array<{
      id: string;
      fieldName: string;
      label: string;
      fieldType:
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
        | 'textarea';
      isRequired: boolean;
      displayOrder: number;
      aiPrompt: string;
      dhis2DataElement?: string;
    }>
  >([]);

  // Fetch workflow data if editing
  const { data: workflowData } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: isEditMode,
  });

  const createWorkflowMutation = useMutation({
    ...workflowControllerCreateWorkflowMutation(),
    onSuccess: (data) => {
      const workflow = (data as { data?: { id?: string } })?.data;
      if (workflow?.id) {
        toast.success('Workflow created successfully!');
        setTimeout(() => {
          window.location.href = `/admin/create-workflow/field-mapping?workflowId=${workflow.id}`;
        }, 1000);
      }
    },
    onError: (error) => {
      console.error('Failed to create workflow:', error);
      const errorMessage =
        (
          error as {
            response?: { data?: { message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        'Failed to create workflow';
      toast.error(errorMessage);
    },
  });

  const upsertConfigMutation = useMutation({
    ...configurationControllerUpsertWorkflowConfigurationsMutation(),
    onSuccess: () => {
      toast.success('Configuration saved successfully!');
    },
  });

  const upsertFieldsMutation = useMutation({
    ...fieldControllerUpsertWorkflowFieldsMutation(),
    onSuccess: () => {
      toast.success('Fields saved successfully!');
    },
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (workflowData && isEditMode) {
      const workflow = (workflowData as { data?: Record<string, unknown> })
        ?.data;
      if (workflow) {
        setAiFieldMappings(
          (workflow.workflowFields as typeof aiFieldMappings) || []
        );
        const dhis2Config = (
          workflow.workflowConfigurations as Array<Record<string, unknown>>
        )?.find((config: Record<string, unknown>) => config.type === 'dhis2');
        if (dhis2Config) {
          setSelectedConnection(
            (dhis2Config.externalConnection as { id?: string })?.id || ''
          );
          setSelectedProgram(
            (dhis2Config.configuration as { programId?: string })?.programId ||
              ''
          );
          setSelectedOrgUnits(
            (dhis2Config.configuration as { orgUnits?: string[] })?.orgUnits ||
              []
          );
          setBasicConfig({
            language:
              (dhis2Config.configuration as { language?: string })?.language ||
              'en',
          });
        }
      }
    }
  }, [workflowData, isEditMode]);

  const handleSave = async () => {
    if (isEditMode && workflowId) {
      // Save current step data
      if (currentStep === 'config' && selectedConnection && selectedProgram) {
        await upsertConfigMutation.mutateAsync({
          path: { workflowId },
        });
      } else if (currentStep === 'text' && aiFieldMappings.length > 0) {
        await upsertFieldsMutation.mutateAsync({
          path: { workflowId },
          body: {
            fields: aiFieldMappings.map((mapping) => ({
              id: mapping.id,
              fieldName: mapping.fieldName,
              label: mapping.label,
              fieldType: mapping.fieldType,
              isRequired: mapping.isRequired,
              displayOrder: mapping.displayOrder,
              aiMapping: { prompt: mapping.aiPrompt },
            })),
          },
        });
      }
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSave();
    const currentIndex = steps.findIndex((step) => step.id === currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id as typeof currentStep);
    }
  };

  const handleCreateWorkflow = async () => {
    if (!selectedConnection || !selectedProgram || aiFieldMappings.length === 0)
      return;

    try {
      await createWorkflowMutation.mutateAsync({
        body: {
          programId: programId || undefined,
          name: name!,
          description: description || '',
          supportedLanguages,
          enabledModes: ['text'],
          workflowFields: aiFieldMappings.map((mapping) => ({
            fieldName: mapping.fieldName,
            label: mapping.label,
            fieldType: mapping.fieldType,
            isRequired: mapping.isRequired,
            displayOrder: mapping.displayOrder,
            aiMapping: { prompt: mapping.aiPrompt },
          })),
          workflowConfigurations: [
            {
              type: 'dhis2' as const,
              externalConnectionId: selectedConnection,
              configuration: {
                programId: selectedProgram,
                orgUnits: selectedOrgUnits,
                ...basicConfig,
              },
              isActive: true,
            },
          ],
        },
      });
    } catch (error) {
      console.error('Failed to create workflow:', error);
    }
  };

  const steps = [
    { id: 'config', label: 'DHIS2 Configuration' },
    { id: 'text', label: 'Text & AI Settings' },
    { id: 'create', label: 'Create Workflow' },
  ];

  const renderTextStep = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 sm:p-4">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
          <h3 className="text-xs font-medium text-blue-900 sm:text-sm">
            Text Processing Settings
          </h3>
        </div>
        <p className="text-xs text-blue-700 sm:text-sm">
          Configure how text input will be processed and analyzed by AI.
        </p>
      </div>

      <AiFieldMappingSection
        aiFieldMappings={aiFieldMappings}
        setAiFieldMappings={setAiFieldMappings}
        basicConfig={basicConfig}
        setBasicConfig={setBasicConfig}
        onShowFieldPreview={() => setShowFieldPreview(true)}
        workflowType="text"
      />
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'config':
        return (
          <DHIS2ConfigStep
            selectedConnection={selectedConnection}
            setSelectedConnection={setSelectedConnection}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedOrgUnits={selectedOrgUnits}
            setSelectedOrgUnits={setSelectedOrgUnits}
          />
        );
      case 'text':
        return renderTextStep();
      case 'create':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-green-900">
                Ready to Create Text Workflow
              </h3>
              <p className="text-sm text-green-700">
                Review your configuration and click &quot;Create Workflow&quot;
                to proceed to field mapping.
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <strong>Name:</strong> {name}
              </div>
              <div>
                <strong>AI Fields:</strong> {aiFieldMappings.length} configured
              </div>
              <div>
                <strong>
                  DHIS2 {selectedType === 'program' ? 'Program' : 'Dataset'}:
                </strong>{' '}
                {selectedProgram}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <WorkflowBuilderLayout
        title="Text Workflow Builder"
        description="Configure DHIS2 integration and AI-powered text processing"
        currentStep={currentStep}
        setCurrentStep={(step) =>
          setCurrentStep(step as 'config' | 'text' | 'create')
        }
        steps={steps}
        onSave={
          currentStep === 'create'
            ? handleCreateWorkflow
            : isEditMode
              ? handleSave
              : () => {}
        }
        onSaveAndContinue={isEditMode ? handleSaveAndContinue : undefined}
        isSaving={
          createWorkflowMutation.isPending ||
          upsertConfigMutation.isPending ||
          upsertFieldsMutation.isPending
        }
        saveButtonText={currentStep === 'create' ? 'Create Workflow' : 'Next'}
        canProceed={(() => {
          switch (currentStep) {
            case 'config':
              return !!(
                selectedConnection &&
                selectedType &&
                selectedProgram &&
                selectedOrgUnits.length > 0
              );
            case 'text':
              return aiFieldMappings.length > 0;
            case 'create':
              return !!(
                selectedConnection &&
                selectedType &&
                selectedProgram &&
                selectedOrgUnits.length > 0 &&
                aiFieldMappings.length > 0
              );
            default:
              return false;
          }
        })()}
        isEditMode={isEditMode}
      >
        {renderCurrentStep()}
      </WorkflowBuilderLayout>

      <FieldPreviewModal
        preSelectedConnection={selectedConnection}
        preSelectedType={selectedType}
        preSelectedProgram={selectedProgram}
        isOpen={showFieldPreview}
        onClose={() => setShowFieldPreview(false)}
        existingFields={aiFieldMappings.map((mapping) => ({
          id: mapping.dhis2DataElement || mapping.id,
          name: mapping.label,
          displayName: mapping.label,
          valueType: mapping.fieldType.toUpperCase(),
          mandatory: mapping.isRequired,
        }))}
        onFieldsSelect={(selectedFields) => {
          const newFields = selectedFields.map((field, index) => ({
            id: Date.now().toString() + index,
            fieldName: field.name.toLowerCase().replace(/\s+/g, '_'),
            label: field.name,
            fieldType:
              field.valueType === 'NUMBER' ||
              field.valueType === 'INTEGER' ||
              field.valueType === 'INTEGER_ZERO_OR_POSITIVE'
                ? ('number' as const)
                : field.valueType === 'DATE'
                  ? ('date' as const)
                  : field.valueType === 'DATETIME'
                    ? ('datetime' as const)
                    : field.valueType === 'BOOLEAN' ||
                        field.valueType === 'TRUE_ONLY'
                      ? ('boolean' as const)
                      : field.valueType === 'EMAIL'
                        ? ('email' as const)
                        : field.valueType === 'PHONE_NUMBER'
                          ? ('phone' as const)
                          : field.valueType === 'URL'
                            ? ('url' as const)
                            : field.valueType === 'LONG_TEXT'
                              ? ('textarea' as const)
                              : ('text' as const),
            isRequired: field.mandatory || false,
            displayOrder: aiFieldMappings.length + index + 1,
            aiPrompt: `Extract ${field.name.toLowerCase()} from the provided text input`,
            dhis2DataElement: field.id,
          }));
          setAiFieldMappings(newFields);
        }}
      />
    </>
  );
}
