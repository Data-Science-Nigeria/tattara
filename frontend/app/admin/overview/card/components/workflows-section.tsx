'use client';

import React, { useState } from 'react';
import {
  Plus,
  FileText,
  Archive,
  Edit,
  Mic,
  Image,
  ClipboardList,
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowControllerArchiveWorkflowMutation } from '@/client/@tanstack/react-query.gen';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  enabledModes: Array<'audio' | 'text' | 'form' | 'image'>;
  users?: Array<{ firstName: string; lastName: string }>;
}

interface WorkflowsSectionProps {
  workflows: Workflow[];
  programId: string;
  programName: string;
  isLoading: boolean;
}

export default function WorkflowsSection({
  workflows,
  programId,
  programName,
  isLoading,
}: WorkflowsSectionProps) {
  const queryClient = useQueryClient();
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const archiveMutation = useMutation({
    ...workflowControllerArchiveWorkflowMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['programControllerFindWorkflowsByProgram'],
      });
      setArchivingId(null);
    },
  });

  const getIcon = (
    enabledModes: Array<'audio' | 'text' | 'form' | 'image'>
  ) => {
    if (enabledModes.includes('audio')) return Mic;
    if (enabledModes.includes('image')) return Image;
    if (enabledModes.includes('form')) return ClipboardList;
    return FileText;
  };

  const handleArchive = (workflowId: string) => {
    setArchivingId(workflowId);
    archiveMutation.mutate({ path: { workflowId } });
  };

  const handleCreateWorkflow = () => {
    window.location.href = `/admin/create-workflow/workflow-details?programId=${programId}`;
  };

  const activeWorkflows = workflows.filter((w) => w.status === 'active');

  if (isLoading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Workflows</h2>
          <p className="text-sm text-gray-600">
            Manage workflows for {programName}
          </p>
        </div>
        <button
          onClick={handleCreateWorkflow}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Create Workflow
        </button>
      </div>

      {activeWorkflows.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No workflows yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by creating your first workflow for this program.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeWorkflows.map((workflow) => {
            const IconComponent = getIcon(workflow.enabledModes);
            return (
              <div
                key={workflow.id}
                className="rounded-lg border border-gray-200 p-4 hover:border-green-300"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <IconComponent className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {workflow.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {workflow.enabledModes.join(', ')} modes
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        (window.location.href = `/admin/create-workflow/workflow-details?workflowId=${workflow.id}`)
                      }
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit workflow"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(workflow.id)}
                      disabled={archivingId === workflow.id}
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600 disabled:opacity-50"
                      title="Archive workflow"
                    >
                      {archivingId === workflow.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-b border-gray-400"></div>
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {workflow.description && (
                  <p className="mb-3 text-sm text-gray-600">
                    {workflow.description}
                  </p>
                )}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{workflow.users?.length || 0} users assigned</span>
                  <span className="rounded-full bg-green-100 px-2 py-1 text-green-700">
                    {workflow.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
