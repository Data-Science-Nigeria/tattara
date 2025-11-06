'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import {
  workflowControllerFindWorkflowByIdOptions,
  fieldMappingControllerUpsertFieldMappingsMutation,
  externalConnectionsControllerFindAllOptions,
} from '@/client/@tanstack/react-query.gen';
import FieldMappingStep from '../builder/components/field-mapping-step';

interface WorkflowField {
  id: string;
  fieldName?: string;
  label?: string;
  fieldType: string;
  dhis2DataElement?: string;
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
}

export default function FieldMapping() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');

  const [fields, setFields] = useState<WorkflowField[]>([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
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
    onSuccess: () => {
      alert('Field mappings saved successfully!');
      window.location.href = '/admin/create-workflow';
    },
  });

  useEffect(() => {
    if (workflowData) {
      const workflow = (workflowData as { data?: Workflow })?.data;
      setFields(workflow?.workflowFields || []);

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
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const handleTest = () => {
    window.location.href = `/admin/create-workflow/test?workflowId=${workflowId}`;
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
      await upsertMappingMutation.mutateAsync({
        path: { workflowId },
        body: { fieldMappings: mappings },
      });
    }
  };

  const handleSaveAndContinue = async () => {
    await handleSave();
    if (!upsertMappingMutation.isError) {
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
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
            >
              <option value="">Select a connection...</option>
              {availableConnections.map((conn) => (
                <option key={conn.id} value={conn.id}>
                  {conn.name} ({conn.baseUrl})
                </option>
              ))}
            </select>
          </div>
        )}

        <FieldMappingStep
          selectedConnection={selectedConnection}
          selectedProgram={selectedProgram}
          fields={fields}
          updateField={updateField}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
        <button
          onClick={handleTest}
          className="rounded-lg border border-green-600 px-6 py-2 text-green-600 hover:bg-green-50"
        >
          Test Mapping
        </button>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={upsertMappingMutation.isPending}
            className="rounded-lg border border-green-600 px-6 py-2 text-green-600 hover:bg-green-50 disabled:opacity-50"
          >
            {upsertMappingMutation.isPending ? 'Saving...' : 'Save'}
          </button>
          <button
            onClick={handleSaveAndContinue}
            disabled={upsertMappingMutation.isPending}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {upsertMappingMutation.isPending ? 'Saving...' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
