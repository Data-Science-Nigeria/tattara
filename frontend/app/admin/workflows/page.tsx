'use client';

import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  workflowControllerGetWorkflowsOptions,
  userControllerFindAllForLoggedInUserOptions,
  collectorControllerGetSubmissionHistoryOptions,
} from '@/client/@tanstack/react-query.gen';
import type { Workflow, User, Submission } from '@/client/types.gen';
import AssignUsersWorkflowModal from './components/assign-users-workflow-modal';
import UnassignUserWorkflowModal from './components/unassign-user-workflow-modal';
import WorkflowTabs from './components/workflow-tabs';
import AssignedWorkflowsTable from './components/assigned-workflows-table';
import ActiveWorkflowsTable from './components/active-workflows-table';
import ArchiveWorkflowModal from './components/archive-workflow-modal';

interface WorkflowAssignment {
  id: string;
  userId: string;
  workflowId: string;
  status: 'pending' | 'completed';
  user: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  workflow: {
    name: string;
    enabledModes?: string[];
  };
}

export default function ManageWorkflows() {
  const [activeTab, setActiveTab] = useState<'assigned' | 'active'>('assigned');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  const [unassignData, setUnassignData] = useState<{
    userId: string;
    workflowId: string;
    userName: string;
    workflowName: string;
  } | null>(null);
  const [archiveData, setArchiveData] = useState<{
    workflowId: string;
    workflowName: string;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCurrentPage, setActiveCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch all workflows and users
  const { data: workflowsData, isLoading: workflowsLoading } = useQuery({
    ...workflowControllerGetWorkflowsOptions({
      query: { page: 1, limit: 1000000 },
    }),
  });

  const { isLoading: usersLoading } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: 1, limit: 1000000 },
    }),
  });

  // Fetch submission history to get workflow completion status
  const { data: submissionsData } = useQuery({
    ...collectorControllerGetSubmissionHistoryOptions({
      query: { page: 1, limit: 100 },
    }),
  });

  const workflowsResponse = workflowsData as {
    data?: { workflows?: Workflow[] } | Workflow[];
  };
  const workflows = Array.isArray(workflowsResponse?.data)
    ? workflowsResponse.data
    : (workflowsResponse?.data as { workflows?: Workflow[] })?.workflows || [];

  const submissionsResponse = submissionsData as {
    data?: { data?: Submission[] };
  };
  const submissions = Array.isArray(submissionsResponse?.data?.data)
    ? submissionsResponse.data.data
    : [];

  // Create workflow assignments from workflows data
  const workflowAssignments: WorkflowAssignment[] = [];

  // Get user-workflow assignments from workflows (exclude archived)
  workflows.forEach((workflow: Workflow) => {
    if (workflow.status === 'archived') return;
    const workflowUsers = workflow.users || [];

    workflowUsers.forEach((user: User) => {
      // Check if user has completed this workflow
      const hasCompleted =
        Array.isArray(submissions) &&
        submissions.some(
          (submission: Submission) =>
            submission.user.id === user.id &&
            submission.workflow.id === workflow.id
        );

      workflowAssignments.push({
        id: `${user.id}-${workflow.id}`,
        userId: user.id,
        workflowId: workflow.id,
        status: hasCompleted ? 'completed' : 'pending',
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        workflow: {
          name: workflow.name,
          enabledModes: workflow.enabledModes,
        },
      });
    });
  });

  // Filter and sort assignments based on search term
  const filteredAssignments = workflowAssignments
    .filter((assignment) => {
      const userName =
        `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim();
      const searchLower = searchTerm.toLowerCase();
      return (
        userName.toLowerCase().includes(searchLower) ||
        assignment.workflow.name.toLowerCase().includes(searchLower) ||
        assignment.user.email.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => a.workflow.name.localeCompare(b.workflow.name));

  // Pagination logic for Assigned tab
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

  // Pagination logic for Active tab
  const activeWorkflows = workflows
    .filter((w: Workflow) => w.status !== 'archived')
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  const activeTotalPages = Math.ceil(activeWorkflows.length / itemsPerPage);
  const activeStartIndex = (activeCurrentPage - 1) * itemsPerPage;
  const activeEndIndex = activeStartIndex + itemsPerPage;
  const currentActiveWorkflows = activeWorkflows.slice(
    activeStartIndex,
    activeEndIndex
  );

  const handleUnassign = (
    userId: string,
    workflowId: string,
    userName: string,
    workflowName: string
  ) => {
    setUnassignData({ userId, workflowId, userName, workflowName });
    setShowUnassignModal(true);
  };

  const handleArchive = (workflowId: string, workflowName: string) => {
    setArchiveData({ workflowId, workflowName });
    setShowArchiveModal(true);
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
                Workflows
              </h1>
            </div>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-2.5 py-2.5 font-medium text-white transition-colors duration-200 hover:bg-green-700 lg:px-4 lg:py-3"
            >
              <Plus className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="hidden lg:inline">Assign Users</span>
            </button>
          </div>

          {/* Search Bar - Only show for Assigned tab */}
          {activeTab === 'assigned' && (
            <>
              <div className="max-w-full sm:max-w-md">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by user name or workflow..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                  />
                </div>
              </div>

              {searchTerm && (
                <p className="text-xs text-gray-600 sm:text-sm">
                  Found {filteredAssignments.length} assignment
                  {filteredAssignments.length !== 1 ? 's' : ''}
                </p>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        <WorkflowTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tables based on active tab */}
        <div className="mt-6">
          {activeTab === 'assigned' && (
            <AssignedWorkflowsTable
              assignments={currentAssignments}
              isLoading={workflowsLoading || usersLoading}
              onUnassign={handleUnassign}
            />
          )}

          {activeTab === 'active' && (
            <ActiveWorkflowsTable
              workflows={currentActiveWorkflows}
              isLoading={workflowsLoading}
              onArchive={handleArchive}
            />
          )}
        </div>

        {/* Pagination */}
        {activeTab === 'assigned' &&
          filteredAssignments.length > 0 &&
          totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1 overflow-x-auto px-4 sm:gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    onClick={() => setCurrentPage(page)}
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
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-2 py-2 text-xs whitespace-nowrap text-gray-600 hover:text-gray-900 disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                Next &gt;
              </button>
            </div>
          )}

        {activeTab === 'active' &&
          activeWorkflows.length > 0 &&
          activeTotalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1 overflow-x-auto px-4 sm:gap-2">
              <button
                onClick={() =>
                  setActiveCurrentPage(Math.max(1, activeCurrentPage - 1))
                }
                disabled={activeCurrentPage === 1}
                className="flex items-center gap-1 px-2 py-2 text-xs whitespace-nowrap text-gray-600 hover:text-gray-900 disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                &lt; Prev
              </button>

              {(() => {
                const maxVisible = window.innerWidth < 640 ? 3 : 7;
                const pages = [];

                if (activeTotalPages <= maxVisible) {
                  for (let i = 1; i <= activeTotalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  const half = Math.floor(maxVisible / 2);
                  let start = Math.max(1, activeCurrentPage - half);
                  const end = Math.min(
                    activeTotalPages,
                    start + maxVisible - 1
                  );

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
                    onClick={() => setActiveCurrentPage(page)}
                    className={`h-7 w-7 flex-shrink-0 rounded border text-xs sm:h-8 sm:w-8 sm:text-sm ${
                      activeCurrentPage === page
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
                  setActiveCurrentPage(
                    Math.min(activeTotalPages, activeCurrentPage + 1)
                  )
                }
                disabled={activeCurrentPage === activeTotalPages}
                className="flex items-center gap-1 px-2 py-2 text-xs whitespace-nowrap text-gray-600 hover:text-gray-900 disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                Next &gt;
              </button>
            </div>
          )}
      </div>

      {/* Modals */}
      {showAssignModal && (
        <AssignUsersWorkflowModal
          isOpen={showAssignModal}
          workflows={workflows}
          onClose={() => setShowAssignModal(false)}
        />
      )}

      {showUnassignModal && unassignData && (
        <UnassignUserWorkflowModal
          isOpen={showUnassignModal}
          userId={unassignData.userId}
          workflowId={unassignData.workflowId}
          userName={unassignData.userName}
          workflowName={unassignData.workflowName}
          onClose={() => {
            setShowUnassignModal(false);
            setUnassignData(null);
          }}
        />
      )}

      {showArchiveModal && archiveData && (
        <ArchiveWorkflowModal
          isOpen={showArchiveModal}
          workflowId={archiveData.workflowId}
          workflowName={archiveData.workflowName}
          onClose={() => {
            setShowArchiveModal(false);
            setArchiveData(null);
          }}
        />
      )}
    </div>
  );
}
