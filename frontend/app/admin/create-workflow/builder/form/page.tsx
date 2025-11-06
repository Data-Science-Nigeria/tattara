'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  workflowControllerCreateWorkflowMutation,
  workflowControllerFindWorkflowByIdOptions,
  configurationControllerUpsertWorkflowConfigurationsMutation,
  fieldControllerUpsertWorkflowFieldsMutation 
} from '@/client/@tanstack/react-query.gen';
import WorkflowBuilderLayout from '../components/workflow-builder-layout';
import DHIS2ConfigStep from '../components/dhis2-config-step';
import FormFieldsStep from '../components/form-fields-step';
import WorkflowTestModal from '../components/workflow-test-modal';

interface FormField {
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
  options?: string[];
  dhis2DataElement?: string;
}

interface WorkflowConfiguration {
  type: string;
  externalConnection?: { id: string };
  configuration?: {
    programId: string;
    orgUnits: string[];
  };
}

interface WorkflowData {
  workflowFields?: FormField[];
  workflowConfigurations?: WorkflowConfiguration[];
}

export default function FormBuilder() {
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

  const [currentStep, setCurrentStep] = useState<
    'config' | 'fields' | 'create'
  >('config');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);

  // DHIS2 Configuration
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([]);

  // Fetch workflow data if editing
  const { data: workflowData } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: isEditMode,
  });

  // Load existing data in edit mode
  useEffect(() => {
    if (workflowData && isEditMode) {
      const workflow = (workflowData as { data?: WorkflowData })?.data;
      if (workflow) {
        setFields(workflow.workflowFields || []);
        const dhis2Config = workflow.workflowConfigurations?.find(
          (config: WorkflowConfiguration) => config.type === 'dhis2'
        );
        if (dhis2Config) {
          setSelectedConnection(dhis2Config.externalConnection?.id || '');
          setSelectedProgram(dhis2Config.configuration?.programId || '');
          setSelectedOrgUnits(dhis2Config.configuration?.orgUnits || []);
        }
      }
    }
  }, [workflowData, isEditMode]);

  const createWorkflowMutation = useMutation({
    ...workflowControllerCreateWorkflowMutation(),
    onSuccess: (data) => {
      const workflow = (data as { data?: { id?: string } })?.data;
      if (workflow?.id) {
        toast.success('Workflow created successfully!');
        window.location.href = `/admin/create-workflow/field-mapping?workflowId=${workflow.id}`;
      }
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

  const handleSave = async () => {
    if (isEditMode && workflowId) {
      // Save current step data
      if (currentStep === 'config' && selectedConnection && selectedProgram) {
        await upsertConfigMutation.mutateAsync({
          path: { workflowId },
        });
      } else if (currentStep === 'fields' && fields.length > 0) {
        await upsertFieldsMutation.mutateAsync({
          path: { workflowId },
          body: {
            fields: fields.map((field) => ({
              id: field.id,
              fieldName: field.fieldName,
              label: field.label,
              fieldType: field.fieldType,
              isRequired: field.isRequired,
              displayOrder: field.displayOrder,
              ...(field.options && { options: field.options }),
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
      setCurrentStep(steps[currentIndex + 1].id as 'config' | 'fields' | 'create');
    }
  };

  const handleCreateWorkflow = async () => {
    if (!selectedConnection || !selectedProgram || fields.length === 0) return;

    try {
      await createWorkflowMutation.mutateAsync({
        body: {
          programId: programId || undefined,
          name: name!,
          description: description || '',
          supportedLanguages,
          enabledModes: ['form'],
          workflowFields: fields.map((field) => ({
            fieldName: field.fieldName,
            label: field.label,
            fieldType: field.fieldType,
            isRequired: field.isRequired,
            displayOrder: field.displayOrder,
            ...(field.options && { options: field.options }),
          })),
          workflowConfigurations: [
            {
              type: 'dhis2' as const,
              externalConnectionId: selectedConnection,
              configuration: {
                programId: selectedProgram,
                orgUnits: selectedOrgUnits,
              },
              isActive: true,
            },
          ],
        },
      });
    } catch (error: unknown) {
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
    }
  };

  const steps = [
    { id: 'config', label: 'DHIS2 Configuration' },
    { id: 'fields', label: 'Form Fields' },
    { id: 'create', label: 'Create Workflow' },
  ];

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'config':
        return (
          <DHIS2ConfigStep
            selectedConnection={selectedConnection}
            setSelectedConnection={setSelectedConnection}
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedOrgUnits={selectedOrgUnits}
            setSelectedOrgUnits={setSelectedOrgUnits}
          />
        );
      case 'fields':
        return <FormFieldsStep fields={fields} setFields={setFields} />;
      case 'create':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-green-900">
                Ready to Create Workflow
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
                <strong>Fields:</strong> {fields.length} configured
              </div>
              <div>
                <strong>DHIS2 Program:</strong> {selectedProgram}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'config':
        return !!(
          selectedConnection &&
          selectedProgram &&
          selectedOrgUnits.length > 0
        );
      case 'fields':
        return fields.length > 0;
      case 'create':
        return !!(
          selectedConnection &&
          selectedProgram &&
          selectedOrgUnits.length > 0 &&
          fields.length > 0
        );
      default:
        return false;
    }
  };

  return (
    <>
      <WorkflowBuilderLayout
        title="Form Builder"
        description="Configure DHIS2 integration and create form fields"
        currentStep={currentStep}
        setCurrentStep={(step) => setCurrentStep(step as typeof currentStep)}
        steps={steps}
        onSave={isEditMode ? handleSave : handleCreateWorkflow}
        onSaveAndContinue={isEditMode ? handleSaveAndContinue : undefined}
        isSaving={createWorkflowMutation.isPending || upsertConfigMutation.isPending || upsertFieldsMutation.isPending}
        saveButtonText={currentStep === 'create' ? 'Create Workflow' : 'Next'}
        canProceed={canProceed()}
        isEditMode={isEditMode}
      >
        {renderCurrentStep()}
      </WorkflowBuilderLayout>

      <WorkflowTestModal
        isOpen={showTestModal}
        onClose={() => {
          setShowTestModal(false);
          window.location.href = '/admin/create-workflow';
        }}
        workflowType="form"
        fields={fields}
      />
    </>
  );
}
