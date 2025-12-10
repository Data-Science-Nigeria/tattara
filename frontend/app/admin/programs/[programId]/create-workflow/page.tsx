'use client';

import React, { useState } from 'react';
import {
  Plus,
  Edit,
  Link2,
  ArrowLeft,
  MoreHorizontal,
  TestTube,
  Archive,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getIconForWorkflow } from '@/app/admin/components/getIconForWorkflow';
import { useQuery } from '@tanstack/react-query';
import { programControllerFindWorkflowsByProgramOptions } from '@/client/@tanstack/react-query.gen';
import SearchInput from '@/app/admin/components/search-input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ArchiveWorkflowModal from './components/archive-workflow-modal';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status?: 'active' | 'inactive' | 'archived';
  enabledModes?: string[];
  fieldMappings?: Array<{
    id: string;
    target: string | Record<string, unknown>;
  }>;
  workflowConfigurations?: Array<{
    id: string;
    type: string;
    updatedAt: string;
    externalConnection?: {
      name?: string;
      type?: string;
    };
  }>;
}

export default function CreateWorkflow() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveWorkflowData, setArchiveWorkflowData] = useState<{
    workflowId: string;
    workflowName: string;
  } | null>(null);

  const itemsPerPage = 10;

  // Get workflows for this specific program
  const { data: workflowsData, isLoading } = useQuery({
    ...programControllerFindWorkflowsByProgramOptions({
      path: { id: programId },
    }),
    enabled: !!programId,
  });

  // Extract workflows from the response structure
  const responseData = workflowsData as {
    data?: Workflow[];
    total?: number;
    pages?: number;
    page?: number;
  };
  const allWorkflows = Array.isArray(responseData?.data)
    ? responseData.data
    : [];

  // Filter workflows based on search term and view mode
  const filteredWorkflows = allWorkflows.filter((workflow: Workflow) => {
    const matchesSearch =
      workflow.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesViewMode =
      viewMode === 'active'
        ? workflow.status === 'active'
        : workflow.status === 'archived';
    return matchesSearch && matchesViewMode;
  });

  // Client-side pagination
  const totalWorkflows = filteredWorkflows.length;
  const totalPages = Math.ceil(totalWorkflows / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const workflows = filteredWorkflows.slice(startIndex, endIndex);

  const pagination = {
    total: totalWorkflows,
    pages: totalPages,
    currentPage: currentPage,
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={`/admin/dashboard`}
                className="mb-3 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 sm:mb-4 sm:text-base"
              >
                <ArrowLeft size={16} className="sm:h-5 sm:w-5" />
                Back to Dashboard
              </Link>
              <h1 className="text-lg font-semibold text-gray-800 sm:text-xl md:text-2xl lg:text-4xl">
                Workflows
              </h1>
            </div>
            <Link
              href={`/admin/programs/${programId}/create-workflow/unified-workflow`}
            >
              <button className="flex items-center gap-2 rounded-lg bg-green-600 px-2.5 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:px-4 lg:py-3">
                <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden lg:inline">Create Workflow</span>
              </button>
            </Link>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-full sm:max-w-md">
              <SearchInput
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>

            {/* Toggle Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setViewMode('active');
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'active'
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setViewMode('archived');
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'archived'
                    ? 'bg-green-600 text-white'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Archived
              </button>
            </div>
          </div>

          {searchTerm && (
            <p className="text-xs text-gray-600 sm:text-sm">
              Found {filteredWorkflows.length} workflow
              {filteredWorkflows.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Workflows Table */}
        <div className="custom-scrollbar overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Mode
                  </th>
                  <th className="sticky right-0 bg-gray-50 px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                        <span className="ml-2 text-sm text-gray-500">
                          Loading workflows...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : workflows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No workflows found
                    </td>
                  </tr>
                ) : (
                  workflows.map((workflow: Workflow) => {
                    const IconComponent = getIconForWorkflow(
                      workflow.enabledModes
                    );
                    return (
                      <tr key={workflow.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="mr-3 flex-shrink-0">
                              <IconComponent className="h-4 w-4 text-gray-600" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {workflow.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="max-w-xs truncate text-sm text-gray-900">
                            {workflow.description || 'No description'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                workflow.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : workflow.status === 'archived'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {workflow.status}
                            </span>
                            {workflow.workflowConfigurations &&
                              workflow.workflowConfigurations.length > 0 && (
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    workflow.fieldMappings &&
                                    workflow.fieldMappings.length > 0
                                      ? 'bg-blue-100 text-blue-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {workflow.fieldMappings &&
                                  workflow.fieldMappings.length > 0
                                    ? 'mapped'
                                    : 'not mapped'}
                                </span>
                              )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                          {workflow.enabledModes?.join(', ') || 'N/A'}
                        </td>
                        <td className="sticky right-0 bg-white px-6 py-4 text-sm font-medium whitespace-nowrap">
                          {workflow.status === 'active' ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-gray-100">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {workflow.workflowConfigurations &&
                                workflow.workflowConfigurations.length > 0 ? (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/admin/programs/${programId}/create-workflow/field-mapping?workflowId=${workflow.id}`
                                        )
                                      }
                                    >
                                      <Link2 className="mr-2 h-4 w-4" />
                                      Map
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/admin/programs/${programId}/create-workflow/unified-workflow?workflowId=${workflow.id}`
                                        )
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => {
                                        setArchiveWorkflowData({
                                          workflowId: workflow.id,
                                          workflowName: workflow.name,
                                        });
                                        setShowArchiveModal(true);
                                      }}
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/admin/programs/${programId}/create-workflow/manual-test?workflowId=${workflow.id}&inputType=${workflow.enabledModes?.[0] || 'text'}`
                                        )
                                      }
                                    >
                                      <TestTube className="mr-2 h-4 w-4" />
                                      Test
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(
                                          `/admin/programs/${programId}/create-workflow/unified-workflow?workflowId=${workflow.id}`
                                        )
                                      }
                                    >
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setArchiveWorkflowData({
                                          workflowId: workflow.id,
                                          workflowName: workflow.name,
                                        });
                                        setShowArchiveModal(true);
                                      }}
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          ) : (
                            <button
                              disabled
                              className="flex h-6 w-6 cursor-not-allowed items-center justify-center rounded-md opacity-50"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {!searchTerm && workflows.length > 0 && pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              &lt; Previous
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
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
                setCurrentPage(Math.min(pagination.pages, currentPage + 1))
              }
              disabled={currentPage === pagination.pages}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              Next &gt;
            </button>
          </div>
        )}

        {/* Archive Modal */}
        {showArchiveModal && archiveWorkflowData && (
          <ArchiveWorkflowModal
            isOpen={showArchiveModal}
            workflowId={archiveWorkflowData.workflowId}
            workflowName={archiveWorkflowData.workflowName}
            programId={programId}
            onClose={() => {
              setShowArchiveModal(false);
              setArchiveWorkflowData(null);
            }}
          />
        )}
      </div>
    </div>
  );
}
