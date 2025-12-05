'use client';

import React, { useState } from 'react';
import { Plus, Edit, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getIconForWorkflow } from '@/app/admin/components/getIconForWorkflow';
import { useQuery } from '@tanstack/react-query';
import {
  workflowControllerGetWorkflowsOptions,
  programControllerFindWorkflowsByProgramOptions,
} from '@/client/@tanstack/react-query.gen';
import SearchWorkflows from './components/search-workflows';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

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
}

interface WorkflowsResponse {
  data?: {
    workflows?: Workflow[];
    total?: number;
    pages?: number;
    page?: number;
  };
}

export default function CreateWorkflow() {
  const params = useParams();
  const router = useRouter();
  const programId = params.programId as string;
  const [searchResults, setSearchResults] = useState<Workflow[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Use program-specific query if programId is present
  const { data: programWorkflowsData, isLoading: programLoading } = useQuery({
    ...programControllerFindWorkflowsByProgramOptions({
      path: { id: programId || '' },
    }),
    enabled: !!programId,
  });

  const { data: allWorkflowsData, isLoading: allLoading } = useQuery({
    ...workflowControllerGetWorkflowsOptions({
      query: { page: currentPage, limit: itemsPerPage },
    }),
    enabled: !programId,
  });

  const workflowsData = programId ? programWorkflowsData : allWorkflowsData;
  const isLoading = programId ? programLoading : allLoading;

  // Extract workflows from the nested structure
  const responseData = (workflowsData as WorkflowsResponse)?.data;
  const allWorkflows = Array.isArray(responseData?.workflows)
    ? responseData.workflows
    : [];
  const pagination = {
    total: responseData?.total || 0,
    pages: responseData?.pages || 1,
    currentPage: responseData?.page || 1,
  };

  const workflows = isSearching ? searchResults : allWorkflows;

  const handleSearchResults = React.useCallback((results: Workflow[]) => {
    setSearchResults(results);
    setIsSearching(true);
  }, []);

  const handleClearSearch = React.useCallback(() => {
    setSearchResults([]);
    setIsSearching(false);
  }, []);

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800 sm:text-xl md:text-2xl lg:text-4xl">
                Workflows
              </h1>
            </div>
            <Link
              href={`/admin/programs/${programId}/create-workflow/workflow-details`}
            >
              <button className="flex items-center gap-2 rounded-lg bg-green-600 px-2.5 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:px-4 lg:py-3">
                <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
                <span className="hidden lg:inline">Create Workflow</span>
              </button>
            </Link>
          </div>

          <div className="max-w-full sm:max-w-md">
            <SearchWorkflows
              onResults={handleSearchResults}
              onClear={handleClearSearch}
            />
          </div>

          {isSearching && (
            <p className="text-xs text-gray-600 sm:text-sm">
              Found {searchResults.length} workflow
              {searchResults.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Workflows Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
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
                  workflows.map((workflow) => {
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
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                          {workflow.enabledModes?.join(', ') || 'N/A'}
                        </td>
                        <td className="sticky right-0 bg-white px-6 py-4 text-sm font-medium whitespace-nowrap">
                          {workflow.status === 'active' && (
                            <div className="flex gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/admin/programs/${programId}/create-workflow/field-mapping?workflowId=${workflow.id}`
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-900"
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Map fields to DHIS2
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() =>
                                      router.push(
                                        `/admin/programs/${programId}/create-workflow/workflow-details?workflowId=${workflow.id}`
                                      )
                                    }
                                    className="text-gray-600 hover:text-gray-900"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Edit workflow</TooltipContent>
                              </Tooltip>
                            </div>
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
        {!isSearching && workflows.length > 0 && pagination.pages > 1 && (
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
      </div>
    </div>
  );
}
