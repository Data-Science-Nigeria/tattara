'use client';

import React, { useState } from 'react';
import { CircleX, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  userControllerFindAllForLoggedInUserOptions,
  programControllerAssignUsersToProgramMutation,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface AssignUsersProgramModalProps {
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

export default function AssignUsersProgramModal({
  isOpen,
  onClose,
  programName,
  programId,
}: AssignUsersProgramModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const assignUsersMutation = useMutation({
    ...programControllerAssignUsersToProgramMutation(),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    ...userControllerFindAllForLoggedInUserOptions({
      query: { page: 1, limit: 1000000 },
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

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u: User) => u.id));
    }
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) return;

    try {
      await assignUsersMutation.mutateAsync({
        path: { id: programId },
        body: { userIds: selectedUsers },
      });

      toast.success(
        `Successfully assigned ${selectedUsers.length} user(s) to ${programName}`
      );

      // Invalidate all queries to force refresh
      await queryClient.invalidateQueries();

      onClose();
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Failed to assign users to program');
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
              Select verified users to assign to this program
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
          <div className="custom-scrollbar max-h-40 overflow-y-auto rounded-lg border p-2">
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-green-600"></div>
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-2">
                {users.map((user: User) => (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50"
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
                      </div>
                    </div>
                  </div>
                ))}
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
                selectedUsers.length === 0 || assignUsersMutation.isPending
              }
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3"
            >
              <Plus size={16} />
              {assignUsersMutation.isPending
                ? 'Assigning...'
                : `Assign Users (${selectedUsers.length} selected)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
