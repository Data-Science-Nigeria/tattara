'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, FileText, GripVertical, Eye } from 'lucide-react';
import {
  workflowControllerCreateWorkflowMutation,
  workflowControllerFindWorkflowByIdOptions,
  configurationControllerUpsertWorkflowConfigurationsMutation,
  fieldControllerUpsertWorkflowFieldsMutation,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import WorkflowBuilderLayout from '../components/workflow-builder-layout';
import DHIS2ConfigStep from '../components/dhis2-config-step';
import TestModal from '../components/test-modal';
import FieldPreviewModal from '../components/field-preview-modal';

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
  const [showTestModal, setShowTestModal] = useState(false);
  const [showFieldPreview, setShowFieldPreview] = useState(false);

  // DHIS2 Configuration
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([]);

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

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
        window.location.href = `/admin/create-workflow/field-mapping?workflowId=${workflow.id}`;
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

  const addAiFieldMapping = () => {
    const newMapping = {
      id: Date.now().toString(),
      fieldName: '',
      label: '',
      fieldType: 'text' as const,
      isRequired: false,
      displayOrder: aiFieldMappings.length + 1,
      aiPrompt: '',
    };
    setAiFieldMappings([...aiFieldMappings, newMapping]);
  };

  const updateAiFieldMapping = (
    id: string,
    updates: Partial<(typeof aiFieldMappings)[0]>
  ) => {
    setAiFieldMappings(
      aiFieldMappings.map((mapping) =>
        mapping.id === id ? { ...mapping, ...updates } : mapping
      )
    );
  };

  const removeAiFieldMapping = (id: string) => {
    setAiFieldMappings(aiFieldMappings.filter((mapping) => mapping.id !== id));
  };

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

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
            Language
          </label>
          <select
            value={basicConfig.language}
            onChange={(e) =>
              setBasicConfig({ ...basicConfig, language: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-xs focus:border-green-500 focus:outline-none sm:px-3 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="yo">Yoruba</option>
            <option value="ig">Igbo</option>
            <option value="ha">Hausa</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="text-sm font-medium text-gray-900 sm:text-lg">
            AI Field Extraction
          </h3>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
            <button
              onClick={() => setShowTestModal(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-blue-600 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 sm:px-4 sm:text-sm"
            >
              <FileText size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Test Text AI</span>
              <span className="sm:hidden">Test AI</span>
            </button>
            <button
              onClick={() => setShowFieldPreview(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-green-600 px-3 py-2 text-xs text-green-600 hover:bg-green-50 sm:px-4 sm:text-sm"
            >
              <Eye size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Browse DHIS2 Fields</span>
              <span className="sm:hidden">Browse Fields</span>
            </button>
            <button
              onClick={addAiFieldMapping}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs text-white hover:bg-green-700 sm:px-4 sm:text-sm"
            >
              <Plus size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add Field</span>
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {aiFieldMappings.map((mapping, index) => (
            <div
              key={mapping.id}
              className="relative rounded-lg border border-gray-200 p-4"
              draggable
              onDragStart={(e) => {
                setDraggedIndex(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex === null || draggedIndex === index) return;
                const newMappings = [...aiFieldMappings];
                const draggedMapping = newMappings[draggedIndex];
                newMappings.splice(draggedIndex, 1);
                newMappings.splice(index, 0, draggedMapping);
                const updatedMappings = newMappings.map((m, i) => ({
                  ...m,
                  displayOrder: i + 1,
                }));
                setAiFieldMappings(updatedMappings);
                setDraggedIndex(null);
              }}
            >
              <div className="absolute top-4 left-2 cursor-move text-gray-400 hover:text-gray-600">
                <GripVertical size={16} />
              </div>
              <div className="ml-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={mapping.fieldName}
                    onChange={(e) =>
                      updateAiFieldMapping(mapping.id, {
                        fieldName: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="e.g., symptoms"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Label
                  </label>
                  <input
                    type="text"
                    value={mapping.label}
                    onChange={(e) =>
                      updateAiFieldMapping(mapping.id, {
                        label: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="Symptoms"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Field Type
                  </label>
                  <select
                    value={mapping.fieldType}
                    onChange={(e) =>
                      updateAiFieldMapping(mapping.id, {
                        fieldType: e.target.value as typeof mapping.fieldType,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="datetime">Date & Time</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-select</option>
                    <option value="boolean">Boolean</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="url">URL</option>
                    <option value="textarea">Textarea</option>
                  </select>
                </div>

                <div className="flex items-end gap-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={mapping.isRequired}
                      onChange={(e) =>
                        updateAiFieldMapping(mapping.id, {
                          isRequired: e.target.checked,
                        })
                      }
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                  <button
                    onClick={() => removeAiFieldMapping(mapping.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  AI Extraction Prompt
                </label>
                <textarea
                  value={mapping.aiPrompt}
                  onChange={(e) =>
                    updateAiFieldMapping(mapping.id, {
                      aiPrompt: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  rows={3}
                  placeholder="e.g., Extract all symptoms mentioned in the text input"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
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
        setCurrentStep={(step) => setCurrentStep(step as typeof currentStep)}
        steps={steps}
        onSave={isEditMode ? handleSave : handleCreateWorkflow}
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

      <TestModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        workflowType="text"
        workflowId={workflowId || 'test-workflow'}
      />

      <FieldPreviewModal
        preSelectedConnection={selectedConnection}
        preSelectedType={selectedType}
        preSelectedProgram={selectedProgram}
        isOpen={showFieldPreview}
        onClose={() => setShowFieldPreview(false)}
        onFieldsSelect={(selectedFields) => {
          const newFields = selectedFields.map((field, index) => ({
            id: Date.now().toString() + index,
            fieldName: field.name.toLowerCase().replace(/\s+/g, '_'),
            label: field.name,
            fieldType:
              field.valueType === 'NUMBER' || field.valueType === 'INTEGER'
                ? ('number' as const)
                : field.valueType === 'DATE'
                  ? ('date' as const)
                  : field.valueType === 'BOOLEAN' ||
                      field.valueType === 'TRUE_ONLY'
                    ? ('boolean' as const)
                    : ('text' as const),
            isRequired: field.mandatory || false,
            displayOrder: aiFieldMappings.length + index + 1,
            aiPrompt: `Extract ${field.name.toLowerCase()} from the provided text input`,
          }));
          setAiFieldMappings([...aiFieldMappings, ...newFields]);
        }}
      />
    </>
  );
}
