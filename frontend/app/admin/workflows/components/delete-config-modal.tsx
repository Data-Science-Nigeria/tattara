'use client';

import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  configurationControllerRemoveWorkflowConfigurationMutation,
  workflowControllerGetWorkflowsQueryKey,
} from '@/client/@tanstack/react-query.gen';

interface DeleteConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configId: string;
  workflowName: string;
}

export default function DeleteConfigModal({
  isOpen,
  onClose,
  configId,
  workflowName,
}: DeleteConfigModalProps) {
  const queryClient = useQueryClient();

  const deleteConfigMutation = useMutation({
    ...configurationControllerRemoveWorkflowConfigurationMutation(),
    onSuccess: () => {
      toast.success('Workflow configuration deleted successfully');
      queryClient.invalidateQueries({
        queryKey: workflowControllerGetWorkflowsQueryKey(),
      });
      onClose();
    },
    onError: () => {
      toast.error('Failed to delete workflow configuration');
    },
  });

  const handleDelete = () => {
    deleteConfigMutation.mutate({
      path: { configId },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={deleteConfigMutation.isPending}
        >
          <X size={20} />
        </button>

        <h2 className="mb-4 text-xl font-semibold text-gray-900">
          Delete Workflow Configuration
        </h2>

        <p className="mb-6 text-gray-600">
          Are you sure you want to delete the configuration for{' '}
          <span className="font-semibold">{workflowName}</span>?
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={deleteConfigMutation.isPending}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteConfigMutation.isPending}
            className="rounded-lg bg-[#DB363B] px-4 py-2 text-white hover:bg-[#C02F33] disabled:opacity-50"
          >
            {deleteConfigMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
