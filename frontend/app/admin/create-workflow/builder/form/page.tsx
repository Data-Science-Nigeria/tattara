'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workflowControllerCreateWorkflowMutation } from '@/client/@tanstack/react-query.gen';
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

export default function FormBuilder() {
  const searchParams = useSearchParams();

  // Get workflow data from URL params
  const programId = searchParams.get('programId');
  const name = searchParams.get('name');
  const description = searchParams.get('description');
  const supportedLanguages = searchParams
    .get('supportedLanguages')
    ?.split(',') || ['en'];

  const [currentStep, setCurrentStep] = useState<
    'config' | 'fields' | 'create'
  >('config');
  const [fields, setFields] = useState<FormField[]>([]);
  const [showTestModal, setShowTestModal] = useState(false);

  // DHIS2 Configuration
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([]);

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
        onSave={handleCreateWorkflow}
        isSaving={createWorkflowMutation.isPending}
        saveButtonText={currentStep === 'create' ? 'Create Workflow' : 'Next'}
        canProceed={canProceed()}
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
