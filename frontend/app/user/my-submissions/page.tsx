'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Layers, CheckCircle2, Search, X } from 'lucide-react';
import {
  collectorControllerGetSubmissionHistoryOptions,
  workflowControllerGetWorkflowsOptions,
  authControllerGetProfileOptions,
} from '@/client/@tanstack/react-query.gen';

interface Submission {
  id: string;
  workflow: {
    id: string;
    name: string;
    description: string;
  };
  status: string;
  submittedAt: string;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  bgColor: string;
  iconColor: string;
}

const StatCard = ({
  icon,
  title,
  value,
  bgColor,
  iconColor,
}: StatCardProps) => (
  <div className="rounded-lg border border-gray-200 bg-white p-6">
    <div className="flex items-center gap-4">
      <div className={`rounded-lg ${bgColor} p-3`}>
        <div className={iconColor}>{icon}</div>
      </div>
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  </div>
);

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

export default function MySubmissions() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: profileData } = useQuery(authControllerGetProfileOptions());
  const userProfile = (profileData as { data?: { id: string } })?.data;
  const userId = userProfile?.id;

  const { data: workflowsData } = useQuery({
    ...workflowControllerGetWorkflowsOptions({
      query: { page: 1, limit: 1000000, userId },
    }),
    enabled: !!userId,
  });

  const { data: submissionsData, isLoading } = useQuery({
    ...collectorControllerGetSubmissionHistoryOptions({
      query: { page: 1, limit: 100 },
    }),
    enabled: !!userId,
  });

  const allWorkflows =
    (workflowsData as { data?: { workflows: Array<{ status: string }> } })?.data
      ?.workflows || [];
  const totalWorkflows = allWorkflows.filter(
    (w) => w.status === 'active'
  ).length;

  const submissions = useMemo(() => {
    const response = submissionsData as { data?: { data?: Submission[] } };
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  }, [submissionsData]);

  const stats = useMemo(() => {
    const pending = submissions.filter((s) =>
      ['pending', 'draft'].includes(s.status.toLowerCase())
    ).length;
    const submitted = submissions.filter((s) =>
      ['submitted', 'completed', 'synced'].includes(s.status.toLowerCase())
    ).length;
    return { pending, submitted };
  }, [submissions]);

  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      submission.workflow?.name?.toLowerCase().includes(search.toLowerCase()) ||
      submission.workflow?.description
        ?.toLowerCase()
        .includes(search.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSubmissions = filteredSubmissions.slice(startIndex, endIndex);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-6 px-0 sm:mb-8 sm:px-2">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            My Submissions
          </h1>
        </div>

        {/* Stat Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <StatCard
            icon={<Layers size={24} />}
            title="Total Workflows"
            value={totalWorkflows}
            bgColor="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            icon={<CheckCircle2 size={24} />}
            title="Total Submitted"
            value={stats.submitted}
            bgColor="bg-green-50"
            iconColor="text-green-600"
          />
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by workflow name or description..."
              className="w-full rounded-lg border border-gray-300 py-2 pr-10 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
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
                  <span className="text-sm sm:text-base">Workflow Name</span>
                </th>
                <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                  <span className="text-sm sm:text-base">Description</span>
                </th>
                <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                  <span className="text-sm sm:text-base">Status</span>
                </th>
                <th className="px-3 py-4 text-left font-semibold text-gray-700 sm:px-6">
                  <span className="text-sm sm:text-base">Submitted At</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-gray-500 sm:px-6"
                  >
                    <div className="flex items-center justify-center py-4">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                      <span className="ml-2 text-sm">
                        Loading submissions...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : currentSubmissions.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-4 text-center text-sm text-gray-500 sm:px-6"
                  >
                    {search
                      ? 'No submissions found matching your search'
                      : 'No submissions yet'}
                  </td>
                </tr>
              ) : (
                currentSubmissions.map((submission) => (
                  <tr key={submission.id} className="border-b">
                    <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                      {submission.workflow?.name || 'N/A'}
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                      {submission.workflow?.description || 'N/A'}
                    </td>
                    <td className="px-3 py-4 text-gray-700 sm:px-6">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-3 py-4 text-sm text-gray-700 sm:px-6">
                      {formatDate(submission.submittedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {currentSubmissions.length > 0 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Showing:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="rounded border border-gray-300 px-2 py-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
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
