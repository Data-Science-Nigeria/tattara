'use client';

import React, { useState } from 'react';
import WorkflowCard from './components/workFlowCard';
import { Mic, FileText, ClipboardList, Image } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  authControllerGetProfileOptions,
  workflowControllerGetWorkflowsOptions,
} from '../../../client/@tanstack/react-query.gen';

interface Workflow {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onClick: () => void;
}

interface ApiWorkflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  enabledModes: Array<'audio' | 'text' | 'form' | 'image'>;
  users?: Array<{ id: string }>;
}

interface ProfileResponse {
  data: {
    id: string;
  };
}

interface WorkflowsResponse {
  success: boolean;
  data: {
    data: ApiWorkflow[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  timestamp: string;
}

export default function Workflows() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);

  // Get user profile for user ID
  const { data: profileData } = useQuery(authControllerGetProfileOptions());
  const userProfile = (profileData as ProfileResponse)?.data;
  const userId = userProfile?.id;

  // Get workflows assigned to user
  const {
    data: workflowsData,
    isLoading,
    error,
  } = useQuery({
    ...workflowControllerGetWorkflowsOptions({
      query: { page: 1, limit: 100, userId: userId },
    }),
    enabled: !!userId,
    retry: 1,
  });

  const getIconForWorkflow = (
    enabledModes: Array<'audio' | 'text' | 'form' | 'image'>
  ) => {
    if (enabledModes.includes('audio')) return Mic;
    if (enabledModes.includes('image')) return Image;
    if (enabledModes.includes('form')) return ClipboardList;
    if (enabledModes.includes('text')) return FileText;
    return FileText;
  };

  // Extract workflows from API response
  const allUserWorkflows =
    (workflowsData as WorkflowsResponse)?.data?.data || [];
  const activeWorkflows = allUserWorkflows.filter((w) => w.status === 'active');
  const finalWorkflows = activeWorkflows;

  // Pagination logic
  const totalWorkflows = finalWorkflows.length;
  const totalPages = Math.ceil(totalWorkflows / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWorkflows = finalWorkflows.slice(startIndex, endIndex);

  const workflows: Workflow[] = currentWorkflows.map(
    (workflow: ApiWorkflow) => ({
      icon: React.createElement(getIconForWorkflow(workflow.enabledModes), {
        className: 'h-6 w-6',
      }),
      title: workflow.name,
      description: workflow.description || 'No description available',
      actionLabel: 'Start Collection',
      onClick: () => (window.location.href = `/user/workflow/${workflow.id}`),
    })
  );

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-6 px-0 sm:mb-8 sm:px-2">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            Available Workflows
          </h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
          </div>
        ) : error ? (
          <div className="py-12 text-center">
            <p className="mb-4 text-red-500">
              Failed to load workflows. Please contact your administrator.
            </p>
            <p className="text-sm text-gray-500">
              Error: Unable to connect to the server
            </p>
          </div>
        ) : workflows.length > 0 ? (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workflows.map((workflow, idx) => (
              <WorkflowCard key={idx} {...workflow} />
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-500">No workflows assigned to you</p>
          </div>
        )}

        {/* Pagination */}
        {workflows.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-gray-300 px-2 py-1"
              >
                <option value={6}>6</option>
                <option value={10}>10</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
