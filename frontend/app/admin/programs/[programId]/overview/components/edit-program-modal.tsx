'use client';

import { CircleX } from 'lucide-react';
import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  programControllerUpdateMutation,
  programControllerGetProgramsOptions,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface EditProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programData?: {
    title: string;
    description: string;
  };
  programId?: string;
}

const EditProgramModal: React.FC<EditProgramModalProps> = ({
  isOpen,
  onClose,
  programData = { title: '', description: '' },
  programId,
}) => {
  const [title, setTitle] = useState(programData.title);
  const [description, setDescription] = useState(programData.description);
  const queryClient = useQueryClient();

  const updateProgram = useMutation({
    ...programControllerUpdateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: programControllerGetProgramsOptions().queryKey,
      });
    },
  });

  const handleSubmit = async () => {
    if (!programId) {
      toast.error('Program ID is missing');
      return;
    }

    try {
      await updateProgram.mutateAsync({
        path: { id: programId },
        body: { name: title, description },
      });

      toast.success('Program updated successfully');
      onClose();
      window.location.reload();
    } catch {
      toast.error('Failed to update program');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-4 sm:max-w-lg sm:p-6 md:max-w-xl md:p-8 lg:max-w-2xl lg:p-10">
        <div className="mb-4 flex items-start justify-between sm:mb-6">
          <div>
            <h1 className="text-lg font-semibold text-[#2F3A4C] sm:text-xl lg:text-2xl">
              Edit Program
            </h1>
            <p className="text-xs text-[#7987A0] sm:text-sm">
              Update program details
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-gray-500 hover:text-gray-700"
          >
            <CircleX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mb-4 space-y-3 sm:mb-6 sm:space-y-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 sm:mb-2 sm:text-sm">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter your Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-2 text-sm focus:border-green-500 focus:outline-none sm:py-3"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 sm:mb-2 sm:text-sm">
              Description
            </label>
            <textarea
              placeholder="Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full resize-none rounded-xl border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-2 text-sm focus:border-green-500 focus:outline-none sm:py-3"
            />
          </div>
        </form>
        <div className="flex justify-end">
          <div className="flex gap-2 sm:gap-4">
            <button
              onClick={onClose}
              className="px-3 py-2 text-sm text-[#999AAA] hover:text-gray-700 sm:px-4 sm:py-3"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={updateProgram.isPending}
              className="rounded-xl bg-green-800 px-4 py-2 text-sm text-white transition-colors hover:bg-green-900 disabled:opacity-50 sm:px-6 sm:py-3"
            >
              {updateProgram.isPending ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProgramModal;
