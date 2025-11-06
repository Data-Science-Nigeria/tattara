'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2, Mic, GripVertical } from 'lucide-react';
import { 
  workflowControllerCreateWorkflowMutation,
  workflowControllerFindWorkflowByIdOptions,
  configurationControllerUpsertWorkflowConfigurationsMutation,
  fieldControllerUpsertWorkflowFieldsMutation 
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import WorkflowBuilderLayout from '../components/workflow-builder-layout';
import DHIS2ConfigStep from '../components/dhis2-config-step';
import WorkflowTestModal from '../components/workflow-test-modal';

export default function AudioBuilder() {
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

  const [currentStep, setCurrentStep] = useState<'config' | 'audio' | 'create'>(
    'config'
  );
  const [showTestModal, setShowTestModal] = useState(false);

  // DHIS2 Configuration
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedOrgUnits, setSelectedOrgUnits] = useState<string[]>([]);

  // Audio Configuration
  const [audioConfig, setAudioConfig] = useState({
    language: 'en',
    transcriptionModel: 'whisper-1',
    enableSpeakerDiarization: false,
    confidenceThreshold: 0.8,
    autoProcessing: true,
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
        window.location.href = `/admin/create-workflow/builder/audio?workflowId=${workflow.id}&step=mapping`;
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

  // Load existing data in edit mode
  useEffect(() => {
    if (workflowData && isEditMode) {
      const workflow = (workflowData as { data?: {
        workflowFields?: typeof aiFieldMappings;
        workflowConfigurations?: Array<{
          type: string;
          externalConnection?: { id: string };
          configuration?: {
            programId: string;
            orgUnits: string[];
            audioConfig: typeof audioConfig;
          };
        }>;
      } })?.data;
      if (workflow) {
        setAiFieldMappings(workflow.workflowFields || []);
        const dhis2Config = workflow.workflowConfigurations?.find(
          (config) => config.type === 'dhis2'
        );
        if (dhis2Config) {
          setSelectedConnection(dhis2Config.externalConnection?.id || '');
          setSelectedProgram(dhis2Config.configuration?.programId || '');
          setSelectedOrgUnits(dhis2Config.configuration?.orgUnits || []);
          setAudioConfig(dhis2Config.configuration?.audioConfig || audioConfig);
        }
      }
    }
  }, [workflowData, isEditMode, audioConfig]);

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
      } else if (currentStep === 'audio' && aiFieldMappings.length > 0) {
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
          enabledModes: ['audio'],
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
                audioConfig,
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
    { id: 'audio', label: 'Audio & AI Settings' },
    { id: 'create', label: 'Create Workflow' },
  ];

  const renderAudioStep = () => (
    <div className="space-y-6">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="mb-2 flex items-center gap-2">
          <Mic className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-900">
            Audio Processing Settings
          </h3>
        </div>
        <p className="text-sm text-blue-700">
          Configure how audio input will be processed and transcribed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Language
          </label>
          <select
            value={audioConfig.language}
            onChange={(e) =>
              setAudioConfig({ ...audioConfig, language: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          >
            <option value="en">English</option>
            <option value="yo">Yoruba</option>
            <option value="ig">Igbo</option>
            <option value="ha">Hausa</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Transcription Model
          </label>
          <select
            value={audioConfig.transcriptionModel}
            onChange={(e) =>
              setAudioConfig({
                ...audioConfig,
                transcriptionModel: e.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          >
            <option value="whisper-1">Whisper v1 (Fast)</option>
            <option value="whisper-2">Whisper v2 (Accurate)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={audioConfig.enableSpeakerDiarization}
            onChange={(e) =>
              setAudioConfig({
                ...audioConfig,
                enableSpeakerDiarization: e.target.checked,
              })
            }
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            Enable speaker diarization
          </span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={audioConfig.autoProcessing}
            onChange={(e) =>
              setAudioConfig({
                ...audioConfig,
                autoProcessing: e.target.checked,
              })
            }
            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-700">
            Auto-process audio after recording
          </span>
        </label>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            AI Field Extraction
          </h3>
          <button
            onClick={addAiFieldMapping}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Plus size={16} />
            Add Field
          </button>
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
                    placeholder="e.g., patient_age"
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
                    placeholder="Patient Age"
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
                  placeholder="e.g., Extract the patient's age from the audio transcription"
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
            selectedProgram={selectedProgram}
            setSelectedProgram={setSelectedProgram}
            selectedOrgUnits={selectedOrgUnits}
            setSelectedOrgUnits={setSelectedOrgUnits}
          />
        );
      case 'audio':
        return renderAudioStep();
      case 'create':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-green-900">
                Ready to Create Audio Workflow
              </h3>
              <p className="text-sm text-green-700">
                Review your configuration and click &ldquo;Create
                Workflow&rdquo; to proceed to field mapping.
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
                <strong>DHIS2 Program:</strong> {selectedProgram}
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
        title="Audio Workflow Builder"
        description="Configure DHIS2 integration and AI-powered audio processing"
        currentStep={currentStep}
        setCurrentStep={(step) =>
          setCurrentStep(step as 'config' | 'audio' | 'create')
        }
        steps={steps}
        onSave={isEditMode ? handleSave : handleCreateWorkflow}
        onSaveAndContinue={isEditMode ? handleSaveAndContinue : undefined}
        isSaving={createWorkflowMutation.isPending || upsertConfigMutation.isPending || upsertFieldsMutation.isPending}
        saveButtonText={currentStep === 'create' ? 'Create Workflow' : 'Next'}
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
        workflowType="audio"
        fields={aiFieldMappings}
      />
    </>
  );
}
