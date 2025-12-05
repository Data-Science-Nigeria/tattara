'use client';

import React from 'react';
import { CircleX, UserMinus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { programControllerUnassignUsersFromProgramMutation } from '@/client/@tanstack/react-query.gen';

interface UnassignUserProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  programName: string;
  userId: string;
  programId: string;
}

export default function UnassignUserProgramModal({
  isOpen,
  onClose,
  userName,
  programName,
  userId,
  programId,
}: UnassignUserProgramModalProps) {
  const queryClient = useQueryClient();

  const unassignUserMutation = useMutation({
    ...programControllerUnassignUsersFromProgramMutation(),
    onSuccess: () => {
      toast.success(`Successfully removed ${userName} from ${programName}`);
      queryClient.invalidateQueries();
      onClose();
    },
    onError: () => {
      toast.error('Failed to remove user from program');
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
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-lg font-semibold text-[#2F3A4C]">
              Unassign User
            </h1>
            <p className="text-sm text-[#7987A0]">
              Are you sure you want to remove{' '}
              <span className="font-medium text-red-600">{userName}</span> from{' '}
              <span className="font-medium">{programName}</span>?
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700"
          >
            <CircleX className="h-5 w-5" />
          </button>
        </div>

        <div className="flex justify-end gap-4">
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-[#999AAA] hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleUnassign}
              disabled={unassignUserMutation.isPending}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
