'use client';

import React, { useState } from 'react';
import { Plus, FileText, Edit, Mic, Image, Eye, X } from 'lucide-react';

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
  const displayedWorkflows = activeWorkflows.slice(0, 3);
  const hasMore = activeWorkflows.length > 3;

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
        <>
          {/* Card view for lg+ screens */}
          <div className="hidden lg:block">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedWorkflows.map((workflow) => {
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
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/create-workflow/workflow-details?workflowId=${workflow.id}`)
                        }
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit workflow"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
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
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  View All ({activeWorkflows.length})
                </button>
              </div>
            )}
          </div>

          {/* List view for md and below */}
          <div className="lg:hidden">
            <div className="space-y-3">
              {activeWorkflows.slice(0, 3).map((workflow) => {
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
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {workflow.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {workflow.enabledModes.join(', ')} •{' '}
                          {workflow.users?.length || 0} users
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        (window.location.href = `/admin/create-workflow/workflow-details?workflowId=${workflow.id}`)
                      }
                      className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      title="Edit workflow"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            {hasMore && (
              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="h-4 w-4" />
                  View All ({activeWorkflows.length})
                </button>
              </div>
            )}
          </div>

          {/* Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="m-4 max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
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
                <div className="space-y-3">
                  {activeWorkflows.map((workflow) => {
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
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {workflow.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {workflow.enabledModes.join(', ')} •{' '}
                              {workflow.users?.length || 0} users assigned
                            </p>
                            {workflow.description && (
                              <p className="mt-1 text-xs text-gray-400">
                                {workflow.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            (window.location.href = `/admin/create-workflow/workflow-details?workflowId=${workflow.id}`)
                          }
                          className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          title="Edit workflow"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
