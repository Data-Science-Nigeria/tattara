'use client';

import React, { useState } from 'react';
import { Plus, FileText, Mic, Image, Eye, X } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'archived';
  enabledModes: Array<'audio' | 'text' | 'image'>;
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
  const [showModal, setShowModal] = useState(false);

  const getIcon = (enabledModes: Array<'audio' | 'text' | 'image'>) => {
    if (enabledModes.includes('audio')) return Mic;
    if (enabledModes.includes('image')) return Image;
    if (enabledModes.includes('text')) return FileText;
    return FileText;
  };

  const handleCreateWorkflow = () => {
    window.location.href = `/admin/create-workflow/workflow-details?programId=${programId}`;
  };

  const activeWorkflows = workflows.filter((w) => w.status === 'active');
  const displayedWorkflows = activeWorkflows.slice(0, 5);
  const hasMore = activeWorkflows.length > 5;

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
          className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 lg:px-4"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden lg:inline">Create Workflow</span>
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
        <div>
          {/* List view for all screens */}
          <div className="space-y-3">
            {displayedWorkflows.map((workflow) => {
              const IconComponent = getIcon(workflow.enabledModes);
              return (
                <div
                  key={workflow.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 hover:border-green-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-green-100 p-2">
                      <IconComponent className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-gray-900">
                        {workflow.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {workflow.description && (
                          <span className="truncate">
                            {workflow.description}
                          </span>
                        )}
                        {workflow.description && <span>•</span>}
                        <span>{workflow.users?.length || 0} users</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Eye className="h-4 w-4" />
                View All ({activeWorkflows.length})
              </button>
            </div>
          )}

          {/* Modal with List View */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-lg bg-white">
                <div className="flex items-center justify-between border-b p-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    All Workflows ({activeWorkflows.length})
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
                  <div className="space-y-3">
                    {activeWorkflows.map((workflow) => {
                      const IconComponent = getIcon(workflow.enabledModes);
                      return (
                        <div
                          key={workflow.id}
                          className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:border-green-300"
                        >
                          <div className="rounded-lg bg-green-100 p-2">
                            <IconComponent className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium text-gray-900">
                              {workflow.name}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {workflow.description && (
                                <span className="truncate">
                                  {workflow.description}
                                </span>
                              )}
                              {workflow.description && <span>•</span>}
                              <span>{workflow.users?.length || 0} users</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
