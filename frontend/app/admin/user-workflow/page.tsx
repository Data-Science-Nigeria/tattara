'use client';

import React, { useState } from 'react';
import { Plus, UserMinus, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  workflowControllerGetWorkflowsOptions,
  userControllerFindAllForLoggedInUserOptions,
  collectorControllerGetSubmissionHistoryOptions,
} from '@/client/@tanstack/react-query.gen';
import type { Workflow, User, Submission } from '@/client/types.gen';
import AssignUsersWorkflowModal from './components/assign-users-workflow-modal';
import UnassignUserWorkflowModal from './components/unassign-user-workflow-modal';

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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showUnassignModal, setShowUnassignModal] = useState(false);
  const [unassignData, setUnassignData] = useState<{
    userId: string;
    workflowId: string;
    userName: string;
    workflowName: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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

  // Get user-workflow assignments from workflows
  workflows.forEach((workflow: Workflow) => {
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

  // Filter assignments based on search term
  const filteredAssignments = workflowAssignments.filter((assignment) => {
    const userName =
      `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim();
    const searchLower = searchTerm.toLowerCase();
    return (
      userName.toLowerCase().includes(searchLower) ||
      assignment.workflow.name.toLowerCase().includes(searchLower) ||
      assignment.user.email.toLowerCase().includes(searchLower)
    );
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssignments = filteredAssignments.slice(startIndex, endIndex);

  const handleUnassign = (
    userId: string,
    workflowId: string,
    userName: string,
    workflowName: string
  ) => {
    setUnassignData({ userId, workflowId, userName, workflowName });
    setShowUnassignModal(true);
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:gap-4 lg:mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
                User Workflow
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

          {/* Search Bar */}
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
        </div>

        {/* Assignments Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Assigned Workflow
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
                {workflowsLoading || usersLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center py-4">
                        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-[#008647]"></div>
                        <span className="ml-2 text-sm text-gray-500">
                          Loading assignments...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAssignments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      {searchTerm
                        ? 'No assignments found matching your search'
                        : 'No workflow assignments found'}
                    </td>
                  </tr>
                ) : (
                  currentAssignments.map((assignment) => {
                    const userName =
                      `${assignment.user.firstName || ''} ${assignment.user.lastName || ''}`.trim() ||
                      assignment.user.email;
                    return (
                      <tr key={assignment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              {userName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {assignment.workflow.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              assignment.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {assignment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                          {assignment.workflow.enabledModes?.join(', ') ||
                            'N/A'}
                        </td>
                        <td className="sticky right-0 bg-white px-6 py-4 text-sm font-medium whitespace-nowrap">
                          <button
                            onClick={() =>
                              handleUnassign(
                                assignment.userId,
                                assignment.workflowId,
                                userName,
                                assignment.workflow.name
                              )
                            }
                            className="flex items-center gap-1 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-600 transition-colors hover:bg-red-100"
                          >
                            <UserMinus size={14} />
                            Unassign
                          </button>
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
        {filteredAssignments.length > 0 && totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
            >
              &lt; Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            ))}

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
    </div>
  );
}
