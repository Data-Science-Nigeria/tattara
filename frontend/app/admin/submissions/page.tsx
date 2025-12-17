'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { collectorControllerGetSubmissionHistoryOptions } from '@/client/@tanstack/react-query.gen';
import SubmissionStatsCards from '@/components/admin/SubmissionStatsCards';
import AdminSubmissionsTable from '@/components/admin/AdminSubmissionsTable';

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

export default function AdminSubmissions() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: submissionsData, isLoading } = useQuery({
    ...collectorControllerGetSubmissionHistoryOptions({
      query: { page: 1, limit: 100 }, // Get all for client-side filtering
    }),
  });

  const submissions = useMemo(() => {
    const response = submissionsData as { data?: { data?: Submission[] } };
    const data = response?.data?.data;
    return Array.isArray(data) ? data : [];
  }, [submissionsData]);

  const stats = useMemo(() => {
    const completed = submissions.filter((s) =>
      ['submitted', 'completed', 'synced'].includes(s.status.toLowerCase())
    ).length;
    const failed = submissions.filter(
      (s) => s.status.toLowerCase() === 'failed'
    ).length;
    return { completed, failed };
  }, [submissions]);

  // Get date filter from AdminSubmissionsTable component
  const [dateFilter, setDateFilter] = useState('');

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const userName = submission.user
        ? `${submission.user.firstName} ${submission.user.lastName}`.toLowerCase()
        : '';
      const workflowName = submission.workflow?.name?.toLowerCase() || '';
      const searchLower = search.toLowerCase();

      const matchesSearch =
        userName.includes(searchLower) || workflowName.includes(searchLower);
      const matchesDate =
        !dateFilter ||
        new Date(submission.submittedAt).toISOString().split('T')[0] ===
          dateFilter;

      return matchesSearch && matchesDate;
    });
  }, [submissions, search, dateFilter]);

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
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-6 px-0 sm:mb-8 sm:px-2">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            All Submissions
          </h1>
        </div>

        {/* Stats Cards */}
        <SubmissionStatsCards
          completedCount={stats.completed}
          failedCount={stats.failed}
        />

        {/* Submissions Table */}
        <AdminSubmissionsTable
          submissions={currentSubmissions}
          isLoading={isLoading}
          search={search}
          onSearchChange={handleSearchChange}
          selectedDate={dateFilter}
          onDateChange={setDateFilter}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
}
