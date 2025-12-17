'use client';

import React, { useState } from 'react';
import { Eye, Search, X, Calendar } from 'lucide-react';
import SubmissionModal from '@/components/shared/SubmissionModal';

interface Submission {
  id: string;
  workflow: {
    id: string;
    name: string;
    description: string;
  };
  user: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  status: string;
  submittedAt: string;
  metadata?: {
    type?: string;
  };
}

interface AdminSubmissionsTableProps {
  submissions: Submission[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  selectedDate: string;
  onDateChange: (value: string) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
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

export default function AdminSubmissionsTable({
  submissions,
  isLoading,
  search,
  onSearchChange,
  selectedDate,
  onDateChange,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}: AdminSubmissionsTableProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<
    string | null
  >(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name or workflow..."
            className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
          />
          {search && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="custom-scrollbar overflow-x-auto rounded-md border bg-white">
        <table className="w-full min-w-[600px]">
          <thead className="bg-[#F2F3FF]">
            <tr>
              <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <span className="text-sm sm:text-base">Name</span>
              </th>
              <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <span className="text-sm sm:text-base">Workflow Title</span>
              </th>
              <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <span className="text-sm sm:text-base">Status</span>
              </th>
              <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <span className="text-sm sm:text-base">Type</span>
              </th>
              <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <span className="text-sm sm:text-base">Date</span>
                  <div className="relative">
                    <Calendar
                      className="h-4 w-4 cursor-pointer"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    />
                    {showDatePicker && (
                      <div className="absolute top-6 right-0 z-20 w-40 rounded border bg-white p-2 shadow-lg">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => onDateChange(e.target.value)}
                          className="mb-1 w-full rounded border px-1 py-1 text-xs"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              onDateChange('');
                              setShowDatePicker(false);
                            }}
                            className="flex-1 rounded bg-gray-100 px-2 py-1 text-xs hover:bg-gray-200"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => setShowDatePicker(false)}
                            className="flex-1 rounded bg-green-600 px-2 py-1 text-xs text-white hover:bg-green-700"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </th>
              <th className="sticky right-0 bg-[#F2F3FF] px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                <span className="text-sm sm:text-base">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-gray-500 sm:px-6"
                >
                  <div className="flex items-center justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                    <span className="ml-2 text-sm">Loading submissions...</span>
                  </div>
                </td>
              </tr>
            ) : submissions.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-sm text-gray-500 sm:px-6"
                >
                  {search
                    ? 'No submissions found matching your search'
                    : 'No submissions yet'}
                </td>
              </tr>
            ) : (
              submissions.map((submission) => (
                <tr key={submission.id} className="border-b">
                  <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-700 sm:px-6">
                    {submission.user
                      ? `${submission.user.firstName} ${submission.user.lastName}`
                      : 'N/A'}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                    {submission.workflow?.name || 'N/A'}
                  </td>
                  <td className="px-3 py-4 text-gray-700 sm:px-6">
                    <StatusBadge status={submission.status} />
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                    <span className="capitalize">
                      {submission.metadata?.type || 'Text'}
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                    {formatDate(submission.submittedAt)}
                  </td>
                  <td className="sticky right-0 bg-white px-3 py-4 sm:px-6">
                    <button
                      onClick={() => setSelectedSubmissionId(submission.id)}
                      className="flex items-center gap-2 rounded-md bg-[#008647] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#006635]"
                    >
                      <Eye className="h-4 w-4" />
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
      {submissions.length > 0 && (
        <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>Showing:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="rounded border border-gray-300 px-2 py-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={30}>30</option>
            </select>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto px-4 sm:gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-2 py-2 text-xs whitespace-nowrap text-gray-600 hover:text-gray-900 disabled:opacity-50 sm:px-3 sm:text-sm"
            >
              &lt; Prev
            </button>

            {(() => {
              const maxVisible = window.innerWidth < 640 ? 3 : 7;
              const pages = [];

              if (totalPages <= maxVisible) {
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                const half = Math.floor(maxVisible / 2);
                let start = Math.max(1, currentPage - half);
                const end = Math.min(totalPages, start + maxVisible - 1);

                if (end - start + 1 < maxVisible) {
                  start = Math.max(1, end - maxVisible + 1);
                }

                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
              }

              return pages.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`h-7 w-7 flex-shrink-0 rounded border text-xs sm:h-8 sm:w-8 sm:text-sm ${
                    currentPage === page
                      ? 'border-[#008647] bg-[#008647] text-white'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ));
            })()}

            <button
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 px-2 py-2 text-xs whitespace-nowrap text-gray-600 hover:text-gray-900 disabled:opacity-50 sm:px-3 sm:text-sm"
            >
              Next &gt;
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
    </>
  );
}
