'use client';

import React, { useState } from 'react';
import { Plus, FileText, Edit, Link2 } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerGetWorkflowsOptions } from '@/client/@tanstack/react-query.gen';
import SearchWorkflows from './components/search-workflows';

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
    data?: Workflow[];
  };
}

export default function CreateWorkflow() {
  const [searchResults, setSearchResults] = useState<Workflow[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: workflowsData, isLoading } = useQuery({
    ...workflowControllerGetWorkflowsOptions({
      query: { page: 1, limit: 20 },
    }),
  });

  // Extract workflows from the nested structure
  const responseData = (workflowsData as WorkflowsResponse)?.data;
  const allWorkflows = Array.isArray(responseData?.data)
    ? responseData.data
    : [];

  const workflows = isSearching ? searchResults : allWorkflows;

  const handleSearchResults = (results: Workflow[]) => {
    setSearchResults(results);
    setIsSearching(true);
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearching(false);
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800 sm:text-xl md:text-2xl lg:text-4xl">
              Workflows
            </h1>
            <Link href="/admin/create-workflow/select-program">
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
          </div>
        ) : workflows.length > 0 ? (
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:gap-4 md:gap-6 lg:grid-cols-2">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="rounded-xl border-2 border-gray-200 bg-white p-3 transition-all duration-300 hover:border-[#008647] hover:shadow-lg sm:rounded-2xl sm:p-4 lg:p-6"
              >
                <div className="mb-2 flex items-start justify-between sm:mb-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3 lg:gap-4">
                    <div className="flex-shrink-0 rounded-lg bg-gray-100 p-2 sm:rounded-xl sm:p-3">
                      <FileText className="h-4 w-4 text-gray-600 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-1 text-base font-semibold break-words text-gray-800 sm:mb-2 sm:text-lg lg:text-xl">
                        {workflow.name}
                      </h3>
                      <p className="text-xs break-words text-gray-600 sm:text-sm">
                        {workflow.description || 'No description'}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1 sm:mt-2 sm:gap-2">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            workflow.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : workflow.status === 'archived'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {workflow.status}
                        </span>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            workflow.fieldMappings &&
                            workflow.fieldMappings.length > 0
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {workflow.fieldMappings &&
                          workflow.fieldMappings.length > 0
                            ? 'Mapped'
                            : 'Not Mapped'}
                        </span>
                        {workflow.enabledModes && (
                          <span className="text-xs text-gray-500">
                            {workflow.enabledModes.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {workflow.status === 'active' && (
                    <div className="flex flex-shrink-0 gap-0.5 sm:gap-1">
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/create-workflow/field-mapping?workflowId=${workflow.id}`)
                        }
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-blue-600 sm:p-2"
                        title="Map fields to DHIS2"
                      >
                        <Link2 className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/create-workflow/workflow-details?workflowId=${workflow.id}`)
                        }
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 sm:p-2"
                        title="Edit workflow"
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center sm:py-12">
            <p className="mb-4 text-sm text-gray-500 sm:text-base">
              No workflows found
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
