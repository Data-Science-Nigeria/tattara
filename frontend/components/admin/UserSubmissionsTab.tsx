'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, Search, X } from 'lucide-react';
import { collectorControllerGetSubmissionHistoryOptions } from '@/client/@tanstack/react-query.gen';
import SubmissionModal from '@/components/shared/SubmissionModal';

interface Submission {
  id: string;
  workflow: {
    id: string;
    name: string;
    description: string;
  };
  status: string;
  submittedAt: string;
  metadata?: {
    type?: string;
  };
}

interface UserSubmissionsTabProps {
  userId: string;
}

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyle = () => {
    const lowerStatus = status.toLowerCase();
    if (['submitted', 'completed', 'synced'].includes(lowerStatus)) {
      return 'text-[#008647] bg-[#DCF5E9]';
    }
    if (['pending', 'draft'].includes(lowerStatus)) {
      return 'text-[#FD8822] bg-[#FFE2C9]';
    }
    if (lowerStatus === 'processing') {
      return 'text-[#0066CC] bg-[#E6F2FF]';
    }
    if (lowerStatus === 'failed') {
      return 'text-[#C42127] bg-[#FFD3D5]';
    }
    return 'text-gray-600 bg-gray-100';
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${getStatusStyle()}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default function UserSubmissionsTab({
  userId,
}: UserSubmissionsTabProps) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);

  const { data: submissionsData, isLoading } = useQuery({
    ...collectorControllerGetSubmissionHistoryOptions({
      query: { userId, page: 1, limit: 100 },
    }),
    enabled: !!userId,
  });

  const submissions = useMemo(() => {
    const response = submissionsData as { data?: { data?: Submission[] } };
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  }, [submissionsData]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const workflowName = submission.workflow?.name?.toLowerCase() || '';
      const description = submission.workflow?.description?.toLowerCase() || '';
      const searchLower = search.toLowerCase();

      return (
        workflowName.includes(searchLower) || description.includes(searchLower)
      );
    });
  }, [submissions, search]);

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search submissions..."
          className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => handleSearchChange('')}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="custom-scrollbar max-h-96 overflow-x-auto rounded-md border bg-white">
        <table className="w-full min-w-[400px]">
          <thead className="sticky top-0 bg-[#F2F3FF]">
            <tr>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">
                Workflow Title
              </th>
              <th className="px-3 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="sticky right-0 bg-[#F2F3FF] px-3 py-3 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={3} className="px-3 py-4 text-center text-gray-500">
                  <div className="flex items-center justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                    <span className="ml-2 text-sm">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : currentSubmissions.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="px-3 py-4 text-center text-sm text-gray-500"
                >
                  {search ? 'No submissions found' : 'No submissions yet'}
                </td>
              </tr>
            ) : (
              currentSubmissions.map((submission) => (
                <tr key={submission.id} className="border-b">
                  <td className="px-3 py-3 text-sm text-gray-700">
                    <div className="max-w-xs truncate">
                      {submission.workflow?.name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-700">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="sticky right-0 bg-white px-3 py-3">
                    <button
                      onClick={() => setSelectedSubmissionId(submission.id)}
                      className="flex items-center gap-1 rounded-md bg-[#008647] px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-[#006635]"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {currentSubmissions.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Show:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              &lt;
            </button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`h-7 w-7 rounded text-sm ${
                    currentPage === page
                      ? 'bg-[#008647] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              &gt;
            </button>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {selectedSubmissionId && (
        <SubmissionModal
          submissionId={selectedSubmissionId}
          isOpen={!!selectedSubmissionId}
          onClose={() => setSelectedSubmissionId(null)}
        />
      )}
    </div>
  );
}
