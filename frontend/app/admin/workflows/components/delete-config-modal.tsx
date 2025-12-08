'use client';

import { X, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import {
  configurationControllerRemoveWorkflowConfigurationMutation,
  workflowControllerGetWorkflowsQueryKey,
} from '@/client/@tanstack/react-query.gen';

interface DeleteConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  configs: Array<{
    id: string;
    type: string;
    updatedAt: string;
    externalConnection?: { name?: string; type?: string };
  }>;
  workflowName: string;
}

export default function DeleteConfigModal({
  isOpen,
  onClose,
  configs,
  workflowName,
}: DeleteConfigModalProps) {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const deleteConfigMutation = useMutation({
    ...configurationControllerRemoveWorkflowConfigurationMutation(),
    onSuccess: () => {
      toast.success('Configuration deleted successfully');
      queryClient.invalidateQueries({
        queryKey: workflowControllerGetWorkflowsQueryKey(),
      });
      setDeletingId(null);
    },
    onError: () => {
      toast.error('Failed to delete configuration');
      setDeletingId(null);
    },
  });

  const handleDelete = (configId: string) => {
    setDeletingId(configId);
    deleteConfigMutation.mutate({
      path: { configId },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Delete Configurations
        </h2>
        <p className="mb-4 text-sm text-gray-600">
          Workflow: <span className="font-medium">{workflowName}</span> •{' '}
          {configs.length} config{configs.length > 1 ? 's' : ''}
        </p>

        <div className="custom-scrollbar max-h-[400px] space-y-2 overflow-y-auto pr-2">
          {configs.map((config) => (
            <div
              key={config.id}
              className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 p-4 hover:bg-gray-50"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {config.externalConnection?.name || 'Configuration'}
                </p>
                <p className="text-xs text-gray-500">
                  {config.type} •{' '}
                  {new Date(config.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => handleDelete(config.id)}
                disabled={deletingId === config.id}
                className="flex items-center gap-1.5 rounded-lg bg-[#DB363B] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-white hover:bg-[#C02F33] disabled:opacity-50"
              >
                <Trash2 size={12} />
                {deletingId === config.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
