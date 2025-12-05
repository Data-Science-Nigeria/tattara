'use client';

import React from 'react';
import { CircleX, UserMinus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { programControllerUnassignUsersFromProgramMutation } from '@/client/@tanstack/react-query.gen';

interface UnassignUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  programName: string;
  userId: string;
  programId: string;
}

export default function UnassignUserModal({
  isOpen,
  onClose,
  userName,
  programName,
  userId,
  programId,
}: UnassignUserModalProps) {
  const queryClient = useQueryClient();

  const unassignUserMutation = useMutation({
    ...programControllerUnassignUsersFromProgramMutation(),
    onSuccess: () => {
      toast.success(`Successfully unassigned ${userName} from ${programName}`);
      queryClient.invalidateQueries();
      onClose();
    },
    onError: () => {
      toast.error('Failed to unassign user from program');
    },
  });

  const handleUnassign = () => {
    unassignUserMutation.mutate({
      path: { id: programId },
      body: { userIds: [userId] },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-4 sm:max-w-lg sm:p-6 md:max-w-xl md:p-8">
        <div className="mb-4 flex items-start justify-between sm:mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#2F3A4C] sm:text-xl">
              Unassign User
            </h1>
            <p className="text-xs text-[#7987A0] sm:text-sm">
              Are you sure you want to unassign this user from the program?
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700"
          >
            <CircleX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-gray-700">
            <span className="font-medium">User:</span> {userName}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            <span className="font-medium">Program:</span> {programName}
          </p>
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
              onClick={handleUnassign}
              disabled={unassignUserMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:py-3"
            >
              <UserMinus size={16} />
              {unassignUserMutation.isPending
                ? 'Unassigning...'
                : 'Unassign User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
