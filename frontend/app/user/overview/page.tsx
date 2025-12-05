'use client';

import React, { useState } from 'react';
import WorkflowCard from './components/workFlowCard';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
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
  enabledModes: Array<'audio' | 'text' | 'image'>;
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
    workflows: ApiWorkflow[];
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
      query: { page: 1, limit: 1000000, userId: userId },
    }),
    enabled: !!userId,
    retry: 1,
  });

  const getIconForWorkflow = (
    enabledModes: Array<'audio' | 'text' | 'image'>
  ) => {
    if (enabledModes.includes('audio')) return '/microphone-2.svg';
    if (enabledModes.includes('image')) return '/gallery.svg';
    if (enabledModes.includes('text')) return '/edit-2.svg';
    return '/document-text.svg';
  };

  // Extract workflows from API response
  const allUserWorkflows =
    (workflowsData as WorkflowsResponse)?.data?.workflows || [];
  const activeWorkflows = allUserWorkflows.filter((w) => w.status === 'active');
  const finalWorkflows = activeWorkflows;

  // Pagination logic
  const totalWorkflows = finalWorkflows.length;
  const totalPages = Math.ceil(totalWorkflows / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWorkflows = finalWorkflows.slice(startIndex, endIndex);

  const getActionLabel = (
    enabledModes: Array<'audio' | 'text' | 'image'>
  ): string => {
    if (enabledModes.includes('text')) return 'Write Text';
    if (enabledModes.includes('image')) return 'Upload Image';
    if (enabledModes.includes('audio')) return 'Upload or Record Audio';
    return 'Start Collection';
  };

  const workflows: Workflow[] = currentWorkflows.map(
    (workflow: ApiWorkflow) => ({
      icon: (
        <Image
          src={getIconForWorkflow(workflow.enabledModes)}
          alt="Workflow icon"
          width={24}
          height={24}
          className="h-6 w-6"
        />
      ),
      title: workflow.name,
      description: workflow.description || 'No description available',
      actionLabel: getActionLabel(workflow.enabledModes),
      onClick: () => (window.location.href = `/user/data-entry/${workflow.id}`),
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
        {workflows.length > 0 && (
          <div className="mt-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-600">
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
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                &lt; Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded border text-sm ${
                      currentPage === page
                        ? 'border-[#008647] bg-[#008647] text-white'
                        : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                )
              )}

              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
              >
                Next &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
