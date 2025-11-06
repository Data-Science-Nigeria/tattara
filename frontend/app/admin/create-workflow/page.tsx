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
    <div className="relative min-h-screen p-6">
      <div className="w-full">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl lg:text-4xl">
              Workflows
            </h1>
            <Link href="/admin/create-workflow/select-program">
              <button className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-4 font-medium text-white transition-colors duration-200 hover:bg-green-700">
                <Plus className="h-5 w-5" />
                Create Workflow
              </button>
            </Link>
          </div>

          <div className="max-w-md">
            <SearchWorkflows
              onResults={handleSearchResults}
              onClear={handleClearSearch}
            />
          </div>

          {isSearching && (
            <p className="text-sm text-gray-600">
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
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="rounded-2xl border-2 border-gray-200 bg-white p-6 transition-all duration-300 hover:border-[#008647] hover:shadow-lg"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 rounded-xl bg-gray-100 p-3">
                      <FileText className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="mb-2 text-xl font-semibold text-gray-800">
                        {workflow.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {workflow.description || 'No description'}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
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
                        {workflow.enabledModes && (
                          <span className="text-xs text-gray-500">
                            {workflow.enabledModes.join(', ')} modes
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {workflow.status === 'active' && (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/create-workflow/field-mapping?workflowId=${workflow.id}`)
                        }
                        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-blue-600"
                        title="Map fields to DHIS2"
                      >
                        <Link2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          (window.location.href = `/admin/create-workflow/workflow-details?workflowId=${workflow.id}`)
                        }
                        className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        title="Edit workflow"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <p className="mb-4 text-gray-500">No workflows found</p>
          </div>
        )}
      </div>
    </div>
  );
}
