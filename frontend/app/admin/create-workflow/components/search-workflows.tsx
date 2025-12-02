'use client';

import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerSearchWorkflowsOptions } from '@/client/@tanstack/react-query.gen';

interface Workflow {
  id: string;
  name: string;
  description?: string;
}

interface SearchWorkflowsProps {
  onResults: (workflows: Workflow[]) => void;
  onClear: () => void;
}

export default function SearchWorkflows({
  onResults,
  onClear,
}: SearchWorkflowsProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: searchResults, isLoading } = useQuery({
    ...workflowControllerSearchWorkflowsOptions({
      query: { q: searchQuery, page: 1, limit: 50 },
    }),
    enabled: searchQuery.length > 2,
  });

  React.useEffect(() => {
    if (searchResults) {
      const workflows =
        (searchResults as { data?: { workflows?: Workflow[] } })?.data
          ?.workflows || [];
      onResults(workflows);
    }
  }, [searchResults, onResults]);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value.length <= 2) {
      onClear();
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    onClear();
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search workflows..."
          className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
        />
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isLoading && (
        <div className="absolute top-1/2 right-12 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-b border-green-600"></div>
        </div>
      )}

      {searchQuery.length > 0 && searchQuery.length <= 2 && (
        <p className="mt-2 text-xs text-gray-500">
          Type at least 3 characters to search
        </p>
      )}
    </div>
  );
}
