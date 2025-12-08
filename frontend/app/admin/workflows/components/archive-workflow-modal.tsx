'use client';

import { X, Archive } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  workflowControllerArchiveWorkflowMutation,
  workflowControllerGetWorkflowsOptions,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface ArchiveWorkflowModalProps {
  isOpen: boolean;
  workflowId: string;
  workflowName: string;
  onClose: () => void;
}

export default function ArchiveWorkflowModal({
  isOpen,
  workflowId,
  workflowName,
  onClose,
}: ArchiveWorkflowModalProps) {
  const queryClient = useQueryClient();

  const archiveMutation = useMutation({
    ...workflowControllerArchiveWorkflowMutation(),
    onSuccess: () => {
      toast.success('Workflow archived successfully');
      queryClient.invalidateQueries({
        queryKey: workflowControllerGetWorkflowsOptions().queryKey,
      });
      onClose();
    },
    onError: () => {
      toast.error('Failed to archive workflow');
    },
  });

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
            onClick={() => archiveMutation.mutate({ path: { workflowId } })}
            disabled={archiveMutation.isPending}
            className="rounded-lg bg-[#DB363B] px-6 py-2 text-sm text-white transition-colors hover:bg-[#C42127] disabled:opacity-50"
          >
            {archiveMutation.isPending ? 'Archiving...' : 'Archive Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
}
