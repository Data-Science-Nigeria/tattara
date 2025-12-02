'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CircleX, User, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userControllerFindAllForLoggedInUserOptions,
  programControllerFindWorkflowsByProgramOptions,
  workflowControllerAssignUsersToWorkflowMutation,
  workflowControllerFindWorkflowByIdOptions,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface AssignUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName: string;
  programId: string;
}

interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  isEmailVerified: boolean;
}

interface Workflow {
  id: string;
  name: string;
  description?: string;
  users?: Array<{
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
  }>;
}

export default function AssignUsersModal({
  isOpen,
  onClose,
  programName,
  programId,
}: AssignUsersModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedWorkflows, setSelectedWorkflows] = useState<string[]>([]);
  const [workflowUsers, setWorkflowUsers] = useState<Record<string, string[]>>(
    {}
  );
  const queryClient = useQueryClient();

  const assignUsersMutation = useMutation({
    ...workflowControllerAssignUsersToWorkflowMutation(),
  });

  // Fetch workflows for this program
  const { data: workflowsData } = useQuery({
    ...programControllerFindWorkflowsByProgramOptions({
      path: { id: programId },
    }),
    enabled: isOpen,
  });

  const workflows = useMemo(() => {
    return (workflowsData as { data?: Workflow[] })?.data || [];
  }, [workflowsData]);

  // Update workflow users when workflows change
  useEffect(() => {
    if (!isOpen || workflows.length === 0) {
      setWorkflowUsers({});
      return;
    }

    const fetchWorkflowDetails = async () => {
      const newWorkflowUsers: Record<string, string[]> = {};

      for (const workflow of workflows) {
        try {
          const response = await queryClient.fetchQuery({
            ...workflowControllerFindWorkflowByIdOptions({
              path: { workflowId: workflow.id },
            }),
          });

          const workflowData = (response as { data?: Workflow })?.data;
          if (workflowData?.users) {
            newWorkflowUsers[workflow.id] = workflowData.users.map((u) => u.id);
          }
        } catch (error) {
          console.error(`Failed to fetch workflow ${workflow.id}:`, error);
        }
      }

      setWorkflowUsers(newWorkflowUsers);
    };

    fetchWorkflowDetails();
  }, [isOpen, workflows, queryClient]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: 1, limit: 100 },
    }),
    enabled: isOpen,
  });

  interface UsersResponse {
    data:
      | {
          users: User[];
        }
      | User[];
  }

  const responseData = (usersData as UsersResponse)?.data;
  const allUsers = Array.isArray(responseData)
    ? responseData
    : responseData &&
        'users' in responseData &&
        Array.isArray(responseData.users)
      ? responseData.users
      : [];

  // Filter for verified users only
  const users = allUsers.filter((user: User) => user.isEmailVerified);

  const handleUserToggle = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleWorkflowToggle = (workflowId: string) => {
    setSelectedWorkflows((prev) =>
      prev.includes(workflowId)
        ? prev.filter((id) => id !== workflowId)
        : [...prev, workflowId]
    );
  };

  const handleSelectAllWorkflows = () => {
    if (selectedWorkflows.length === workflows.length) {
      setSelectedWorkflows([]);
    } else {
      setSelectedWorkflows(workflows.map((w) => w.id));
    }
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u: User) => u.id));
    }
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0 || selectedWorkflows.length === 0) return;

    try {
      const assignmentPromises = selectedWorkflows.map((workflowId) => {
        // Merge new users with existing users
        const existingUsers = workflowUsers[workflowId] || [];
        const allUsers = [...new Set([...existingUsers, ...selectedUsers])];

        return assignUsersMutation.mutateAsync({
          path: { workflowId },
          body: { userIds: allUsers },
        });
      });

      await Promise.all(assignmentPromises);
      toast.success(
        `Successfully added ${selectedUsers.length} user(s) to ${selectedWorkflows.length} workflow(s)`
      );

      // Invalidate all queries to force refresh
      await queryClient.invalidateQueries();

      onClose();
      setSelectedUsers([]);
      setSelectedWorkflows([]);
    } catch (error) {
      toast.error('Failed to assign users to workflows');
      console.error('Assignment error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-4 sm:max-w-lg sm:p-6 md:max-w-xl md:p-8">
        <div className="mb-4 flex items-start justify-between sm:mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#2F3A4C] sm:text-xl">
              Add Users to {programName}
            </h1>
            <p className="text-xs text-[#7987A0] sm:text-sm">
              Select verified users to add to workflows (existing assignments
              will be preserved)
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700"
          >
            <CircleX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">
              Select Workflows
            </h3>
            <button
              onClick={handleSelectAllWorkflows}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {selectedWorkflows.length === workflows.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
          <div className="custom-scrollbar mb-4 max-h-32 overflow-y-auto rounded-lg border p-2">
            {workflows.length > 0 ? (
              <div className="space-y-2">
                {workflows.map((workflow: Workflow) => {
                  const currentUserCount =
                    workflowUsers[workflow.id]?.length || 0;
                  return (
                    <div
                      key={workflow.id}
                      className="flex items-center gap-3 rounded p-2 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedWorkflows.includes(workflow.id)}
                        onChange={() => handleWorkflowToggle(workflow.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {workflow.name}
                        </p>
                        <p className="text-xs text-blue-600">
                          {currentUserCount} user(s) currently assigned
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-4 text-center text-gray-500">
                No workflows found
              </p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-700">Select Users</h3>
            <button
              onClick={handleSelectAllUsers}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {selectedUsers.length === users.length
                ? 'Deselect All'
                : 'Select All'}
            </button>
          </div>
          <div className="custom-scrollbar max-h-64 overflow-y-auto rounded-lg border p-2">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user: User) => {
                  // Check if user is already assigned to any selected workflow
                  const isAlreadyAssigned = selectedWorkflows.some(
                    (workflowId) => workflowUsers[workflowId]?.includes(user.id)
                  );

                  return (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 ${
                        isAlreadyAssigned ? 'border-blue-200 bg-blue-50' : ''
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserToggle(user.id)}
                        className="h-4 w-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex flex-1 items-center gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {user.firstName && user.lastName
                              ? `${user.firstName} ${user.lastName}`
                              : user.email}
                          </p>
                          {isAlreadyAssigned && (
                            <p className="text-xs font-medium text-blue-600">
                              Already assigned to selected workflow(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-8 text-center text-gray-500">
                No verified users found
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-[#999AAA] hover:text-gray-700 sm:px-4 sm:py-3"
            >
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={
                selectedUsers.length === 0 ||
                selectedWorkflows.length === 0 ||
                assignUsersMutation.isPending
              }
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3"
            >
              <Plus size={16} />
              {assignUsersMutation.isPending
                ? 'Adding...'
                : `Add Users (${selectedUsers.length} users, ${selectedWorkflows.length} workflows)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
