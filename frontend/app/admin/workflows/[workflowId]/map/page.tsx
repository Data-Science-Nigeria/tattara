'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  workflowControllerFindWorkflowByIdOptions,
  fieldMappingControllerUpsertFieldMappingsMutation,
  externalConnectionsControllerFindAllOptions,
} from '@/client/@tanstack/react-query.gen';
import FieldMappingStep from '@/app/admin/programs/[programId]/create-workflow/components/field-mapping-step';
import AudioAiReview from '@/app/admin/programs/[programId]/create-workflow/components/AudioAiReview';
import ImageAiReview from '@/app/admin/programs/[programId]/create-workflow/components/ImageAiReview';
import TextAiReview from '@/app/admin/programs/[programId]/create-workflow/components/TextAiReview';

interface WorkflowField {
  id: string;
  fieldName?: string;
  label?: string;
  fieldType: string;
  dhis2DataElement?: string;
  databaseMapping?: {
    column: string;
  };
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
    program?: string;
    dataSet?: string;
    orgUnit?: string;
    programStage?: string;
  };
}

interface Workflow {
  workflowFields?: WorkflowField[];
  workflowConfigurations?: WorkflowConfiguration[];
  enabledModes?: string[];
}

export default function StandaloneFieldMapping() {
  const router = useRouter();
  const params = useParams();
  const workflowId = params.workflowId as string;

  const [fields, setFields] = useState<WorkflowField[]>([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedType, setSelectedType] = useState<'program' | 'dataSet' | ''>(
    ''
  );
  const [workflowType, setWorkflowType] = useState<'audio' | 'image' | 'text'>(
    'text'
  );
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>([]);
  const [availableConnections, setAvailableConnections] = useState<
    Connection[]
  >([]);
  const [showAiReview, setShowAiReview] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [connectionType, setConnectionType] = useState<
    'dhis2' | 'postgres' | 'mysql'
  >('dhis2');

  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId },
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
      const workflow = (
        workflowData as { data?: Workflow & { supportedLanguages?: string[] } }
      )?.data;
      setFields(workflow?.workflowFields || []);
      setSupportedLanguages(workflow?.supportedLanguages || ['English']);

      const enabledModes = workflow?.enabledModes || ['text'];
      if (enabledModes.includes('audio')) {
        setWorkflowType('audio');
      } else if (enabledModes.includes('image')) {
        setWorkflowType('image');
      } else {
        setWorkflowType('text');
      }

      // Set connection type based on workflow configuration
      const config = workflow?.workflowConfigurations?.[0];
      if (config?.type === 'postgres') {
        setConnectionType('postgres');
      } else if (config?.type === 'mysql') {
        setConnectionType('mysql');
      } else {
        setConnectionType('dhis2');
      }

      const dhis2Config = workflow?.workflowConfigurations?.find(
        (config) => config.type === 'dhis2'
      );

      if (dhis2Config) {
        const connectionId =
          dhis2Config.externalConnectionId ||
          dhis2Config.configuration?.externalConnectionId;

        if (connectionId) {
          setSelectedConnection(connectionId);
        }

        const programOrDatasetId =
          dhis2Config.configuration?.program ||
          dhis2Config.configuration?.dataSet ||
          '';
        setSelectedProgram(programOrDatasetId);

        if (dhis2Config.configuration?.program) {
          setSelectedType('program');
        } else if (dhis2Config.configuration?.dataSet) {
          setSelectedType('dataSet');
        }
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
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const allFieldsMapped =
    fields.length > 0 &&
    fields.every((field) =>
      connectionType === 'dhis2'
        ? field.dhis2DataElement
        : field.databaseMapping?.column
    );

  const handleSave = async () => {
    if (!workflowId) return;

    // Validate workflow data exists
    const workflowFields =
      (workflowData as { data?: { workflowFields?: { id: string }[] } })?.data
        ?.workflowFields || [];
    if (workflowFields.length === 0) {
      toast.error('No workflow fields found. Please refresh and try again.');
      return;
    }

    const mappings = fields
      .filter((field) =>
        connectionType === 'dhis2'
          ? field.dhis2DataElement
          : field.databaseMapping?.column
      )
      .map((field) => ({
        workflowFieldId: field.id,
        targetType: connectionType as 'dhis2' | 'postgres' | 'mysql',
        target:
          connectionType === 'dhis2'
            ? { dataElement: field.dhis2DataElement! }
            : {
                column: field.databaseMapping!.column,
              },
      }));

    if (mappings.length > 0) {
      try {
        await upsertMappingMutation.mutateAsync({
          path: { workflowId },
          body: { fieldMappings: mappings },
        });
        toast.success('Field mappings saved successfully!');
      } catch (error) {
        console.error('Save failed:', error);
        toast.error('Failed to save mappings.');
      }
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSave();
    if (!upsertMappingMutation.isError) {
      router.push('/admin/workflows');
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <button
          onClick={() => router.push('/admin/workflows')}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Workflows
        </button>
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          {connectionType === 'dhis2'
            ? 'Map Fields to DHIS2'
            : `Map Fields to ${connectionType.toUpperCase()}`}
        </h1>
        <p className="text-gray-600">
          {connectionType === 'dhis2'
            ? 'Map workflow fields to DHIS2 data elements'
            : `Map workflow fields to ${connectionType.toUpperCase()} table columns`}
        </p>
      </div>

      <div className="max-w-4xl">
        {connectionType === 'dhis2' && availableConnections.length > 0 && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-yellow-900">
              Select DHIS2 Connection
            </h3>
            <select
              value={selectedConnection}
              onChange={(e) => setSelectedConnection(e.target.value)}
              className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none sm:text-base"
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none sm:text-base"
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
          connectionType={connectionType as 'dhis2' | 'postgres' | 'mysql'}
          workflowConfiguration={
            (
              workflowData as {
                data?: { workflowConfigurations?: Record<string, unknown>[] };
              }
            )?.data?.workflowConfigurations?.[0]
          }
        />

        {showAiReview && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6">
            <h3 className="mb-4 text-lg font-medium">Test Workflow</h3>
            {workflowType === 'audio' && (
              <AudioAiReview
                workflowId={workflowId}
                supportedLanguages={supportedLanguages}
                onReviewComplete={() => setTestCompleted(true)}
              />
            )}
            {workflowType === 'image' && (
              <ImageAiReview
                workflowId={workflowId}
                supportedLanguages={supportedLanguages}
                onReviewComplete={() => setTestCompleted(true)}
              />
            )}
            {workflowType === 'text' && (
              <TextAiReview
                workflowId={workflowId}
                supportedLanguages={supportedLanguages}
                onReviewComplete={() => setTestCompleted(true)}
              />
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:pt-6">
        {!showAiReview ? (
          <button
            onClick={() => setShowAiReview(true)}
            disabled={!allFieldsMapped || upsertMappingMutation.isPending}
            className="w-full rounded-lg border border-green-600 px-4 py-2 text-sm text-green-600 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
          >
            Test Mapping
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setShowAiReview(false);
                setTestCompleted(false);
              }}
              className="w-full rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 sm:w-auto sm:px-6 sm:text-base"
            >
              Reset
            </button>
            <button
              onClick={handleSaveAndContinue}
              disabled={
                !allFieldsMapped ||
                !testCompleted ||
                upsertMappingMutation.isPending
              }
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
            >
              {upsertMappingMutation.isPending
                ? 'Saving...'
                : 'Save & Go to Workflows'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
