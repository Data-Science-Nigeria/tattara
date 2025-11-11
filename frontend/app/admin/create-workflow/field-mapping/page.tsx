'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  workflowControllerFindWorkflowByIdOptions,
  fieldMappingControllerUpsertFieldMappingsMutation,
  externalConnectionsControllerFindAllOptions,
} from '@/client/@tanstack/react-query.gen';
import FieldMappingStep from '../builder/components/field-mapping-step';
import AdminAiReview from '../components/AdminAiReview';

interface WorkflowField {
  id: string;
  fieldName?: string;
  label?: string;
  fieldType: string;
  dhis2DataElement?: string;
  isRequired?: boolean;
  options?: string[];
}

interface Connection {
  id: string;
  name: string;
  type: string;
  baseUrl?: string;
}

interface WorkflowConfiguration {
  type: string;
  externalConnectionId?: string;
  configuration?: {
    externalConnectionId?: string;
    programId?: string;
  };
}

interface Workflow {
  workflowFields?: WorkflowField[];
  workflowConfigurations?: WorkflowConfiguration[];
  enabledModes?: string[];
}

export default function FieldMapping() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');

  const [fields, setFields] = useState<WorkflowField[]>([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedType, setSelectedType] = useState<'program' | 'dataSet' | ''>(
    ''
  );
  const [workflowType, setWorkflowType] = useState<'audio' | 'image' | 'text'>(
    'text'
  );

  // Load saved mappings from localStorage
  useEffect(() => {
    if (workflowId) {
      const savedMappings = localStorage.getItem(
        `field-mappings-${workflowId}`
      );
      if (savedMappings) {
        try {
          const mappings = JSON.parse(savedMappings);
          setFields((prev) =>
            prev.map((field) => ({
              ...field,
              dhis2DataElement: mappings[field.id] || field.dhis2DataElement,
            }))
          );
        } catch (error) {
          console.error('Failed to load saved mappings:', error);
        }
      }
    }
  }, [workflowId, fields.length]);
  const [availableConnections, setAvailableConnections] = useState<
    Connection[]
  >([]);

  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: !!workflowId,
  });

  const { data: connectionsData } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const upsertMappingMutation = useMutation({
    ...fieldMappingControllerUpsertFieldMappingsMutation(),
  });

  useEffect(() => {
    if (workflowData) {
      const workflow = (workflowData as { data?: Workflow })?.data;
      setFields(workflow?.workflowFields || []);

      // Determine workflow type from enabledModes
      const enabledModes = workflow?.enabledModes || ['text'];
      if (enabledModes.includes('audio')) {
        setWorkflowType('audio');
      } else if (enabledModes.includes('image')) {
        setWorkflowType('image');
      } else {
        setWorkflowType('text');
      }

      const dhis2Config = workflow?.workflowConfigurations?.find(
        (config) => config.type === 'dhis2'
      );

      if (dhis2Config) {
        // Get the external connection ID from the DHIS2 config
        const connectionId =
          dhis2Config.externalConnectionId ||
          dhis2Config.configuration?.externalConnectionId;

        if (connectionId) {
          setSelectedConnection(connectionId);
        }

        const programId = dhis2Config.configuration?.programId || '';
        setSelectedProgram(programId);
      }
    }

    if (connectionsData) {
      const connections =
        (connectionsData as { data?: Connection[] })?.data || [];
      const dhis2Connections = connections.filter(
        (conn) => conn.type === 'dhis2'
      );
      setAvailableConnections(dhis2Connections);
    }
  }, [workflowData, connectionsData]);

  const updateField = (id: string, updates: Partial<WorkflowField>) => {
    const updatedFields = fields.map((field) =>
      field.id === id ? { ...field, ...updates } : field
    );
    setFields(updatedFields);

    // Save mappings to localStorage
    if (workflowId && updates.dhis2DataElement !== undefined) {
      const mappings = updatedFields.reduce(
        (acc, field) => {
          if (field.dhis2DataElement) {
            acc[field.id] = field.dhis2DataElement;
          }
          return acc;
        },
        {} as Record<string, string>
      );
      localStorage.setItem(
        `field-mappings-${workflowId}`,
        JSON.stringify(mappings)
      );
    }
  };

  // Check if all fields are mapped
  const allFieldsMapped =
    fields.length > 0 && fields.every((field) => field.dhis2DataElement);

  const [showAiReview, setShowAiReview] = useState(false);
  const [testData, setTestData] = useState<Record<string, string | boolean>>(
    {}
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null
  );
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const handleTest = () => {
    setShowAiReview(true);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];

      setMediaRecorder(recorder);
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);

        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);

        // Process audio with AI
        await processAudio(blob);
      };

      recorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const processAudio = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'recording.webm');
      formData.append('workflowId', workflowId || '');

      setTestData({});
    } catch (error) {
      console.error('Error processing audio:', error);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setTestData({});
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
    }
  };

  const handleSave = async () => {
    if (!workflowId) return;

    const mappings = fields
      .filter((field) => field.dhis2DataElement)
      .map((field) => ({
        workflowFieldId: field.id,
        targetType: 'dhis2' as const,
        target: {
          dataElement: field.dhis2DataElement,
        },
      }));

    if (mappings.length > 0) {
      try {
        await upsertMappingMutation.mutateAsync({
          path: { workflowId },
          body: { fieldMappings: mappings },
        });
        toast.success('Field mappings saved successfully!');
        // Clear localStorage after successful save
        localStorage.removeItem(`field-mappings-${workflowId}`);
      } catch (error) {
        console.error('Save failed:', error);
        toast.error('Failed to save mappings.');
      }
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSave();
    if (!upsertMappingMutation.isError) {
      toast.success('Mappings saved successfully!');
      window.location.href = '/admin/create-workflow';
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <button
          onClick={() => (window.location.href = '/admin/create-workflow')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Workflows
        </button>
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          Map Fields to DHIS2
        </h1>
        <p className="text-gray-600">
          Map workflow fields to DHIS2 data elements
        </p>
      </div>

      <div className="max-w-4xl">
        {availableConnections.length > 0 && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-yellow-900">
              Select DHIS2 Connection
            </h3>
            <select
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select a connection...</option>
              {availableConnections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.baseUrl})
                </option>
              ))}
            </select>

            <h3 className="mb-2 text-sm font-medium text-yellow-900">
              Select Type
            </h3>
            <select
              value={selectedType}
              onChange={(e) =>
                setSelectedType(e.target.value as 'program' | 'dataSet' | '')
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select type...</option>
              <option value="program">Program</option>
              <option value="dataSet">Dataset</option>
            </select>
          </div>
        )}

        <FieldMappingStep
          selectedConnection={selectedConnection}
          selectedProgram={selectedProgram}
          selectedType={selectedType}
          fields={fields}
          updateField={updateField}
        />

        {showAiReview && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-medium">
              Test{' '}
              {workflowType.charAt(0).toUpperCase() + workflowType.slice(1)}{' '}
              Workflow
            </h3>
            {/* AI generates form from audio/image/text - no separate form mode */}
            {workflowType === 'text' ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Enter text data
                  </label>
                  <textarea
                    value={(testData.textInput as string) || ''}
                    onChange={(e) =>
                      setTestData((prev) => ({
                        ...prev,
                        textInput: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    rows={6}
                    placeholder="Enter your text data here..."
                  />
                </div>
                <div className="text-sm text-gray-500">
                  Test mode: Text will be processed by AI to extract structured
                  field values
                </div>
              </div>
            ) : workflowType === 'audio' ? (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <div className="flex flex-col items-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                      <svg
                        className="h-8 w-8 text-red-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="mb-4 text-gray-600">
                      {isRecording
                        ? 'Recording in progress...'
                        : audioBlob
                          ? 'Audio recorded successfully'
                          : 'Click to start recording audio'}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      {!audioBlob && (
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`rounded-lg px-4 py-2 text-white ${
                            isRecording
                              ? 'bg-gray-600 hover:bg-gray-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }`}
                        >
                          {isRecording ? 'Stop Recording' : 'Start Recording'}
                        </button>
                      )}
                      {audioBlob && (
                        <>
                          <button
                            onClick={startRecording}
                            className="w-full rounded-lg bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 sm:w-auto sm:px-4 sm:text-base"
                          >
                            Record Again
                          </button>
                          <button
                            onClick={clearRecording}
                            className="w-full rounded-lg bg-gray-600 px-3 py-2 text-sm text-white hover:bg-gray-700 sm:w-auto sm:px-4 sm:text-base"
                          >
                            Clear
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  Test mode: Audio will be transcribed and processed by AI to
                  extract field values
                </div>
              </div>
            ) : workflowType === 'image' ? (
              <div className="space-y-4">
                {!selectedImage ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <p className="mb-4 text-gray-600">
                      Upload an image or take a photo
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="image-upload"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = URL.createObjectURL(file);
                          setSelectedImage(file);
                          setImagePreview(url);
                        }
                      }}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      Choose Image
                    </label>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-start gap-4">
                      {imagePreview && (
                        <div className="flex-shrink-0">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-24 w-24 rounded-lg border border-gray-200 object-cover sm:h-32 sm:w-32"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {selectedImage?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {selectedImage
                            ? (selectedImage.size / (1024 * 1024)).toFixed(2)
                            : '0'}{' '}
                          MB
                        </p>

                        <button
                          onClick={() => {
                            setSelectedImage(null);
                            setImagePreview(null);
                            const input = document.getElementById(
                              'image-upload'
                            ) as HTMLInputElement;
                            if (input) input.value = '';
                          }}
                          className="mt-2 text-sm text-red-600 hover:text-red-800"
                        >
                          Remove Image
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-sm text-gray-500">
                  Test mode: Image will be processed by OCR to extract text and
                  field values
                </div>
              </div>
            ) : null}
            <AdminAiReview
              workflowId={workflowId || ''}
              formData={testData}
              onReviewComplete={() => {}}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:pt-6">
        <button
          onClick={handleTest}
          disabled={!allFieldsMapped || upsertMappingMutation.isPending}
          className="w-full rounded-lg border border-green-600 px-4 py-2 text-sm text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
        >
          {upsertMappingMutation.isPending ? 'Saving...' : 'Test Mapping'}
        </button>
        <button
          onClick={handleSaveAndContinue}
          disabled={!allFieldsMapped || upsertMappingMutation.isPending}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
        >
          {upsertMappingMutation.isPending
            ? 'Saving...'
            : 'Save & Go to Workflows'}
        </button>
      </div>
    </div>
  );
}
