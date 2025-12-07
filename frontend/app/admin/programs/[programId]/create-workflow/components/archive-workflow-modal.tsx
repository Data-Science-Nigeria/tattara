'use client';

import { Archive, X } from 'lucide-react';
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workflowControllerArchiveWorkflowMutation,
  programControllerFindWorkflowsByProgramOptions,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface ArchiveWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowName?: string;
  workflowId?: string;
  programId?: string;
}

const ArchiveWorkflowModal: React.FC<ArchiveWorkflowModalProps> = ({
  isOpen,
  onClose,
  workflowName = 'this workflow',
  workflowId,
  programId,
}) => {
  const queryClient = useQueryClient();

  const archiveWorkflow = useMutation({
    ...workflowControllerArchiveWorkflowMutation(),
  });

  const handleArchive = async () => {
    if (!workflowId) return;

    try {
      await archiveWorkflow.mutateAsync({
        path: { workflowId },
      });

      toast.success('Workflow archived successfully!');

      // Invalidate workflows cache to refresh the list
      if (programId) {
        queryClient.invalidateQueries({
          queryKey: programControllerFindWorkflowsByProgramOptions({
            path: { id: programId },
          }).queryKey,
        });
      }

      onClose();
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to archive workflow';
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Archive className="h-6 w-6 text-[#DB363B]" />
            <h1 className="text-xl font-semibold text-[#DB363B]">
              Archive Workflow
            </h1>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-8 text-[#848595]">
          Are you sure you want to archive {workflowName}? This workflow will be
          moved to archived workflows.
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#848595] hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleArchive}
            disabled={archiveWorkflow.isPending}
            className="rounded-lg bg-[#DB363B] px-6 py-2 text-sm text-white transition-colors hover:bg-[#C42127] disabled:opacity-50"
          >
            {archiveWorkflow.isPending ? 'Archiving...' : 'Archive Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveWorkflowModal;
