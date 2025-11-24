'use client';

import { Trash2, X } from 'lucide-react';
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { programControllerRemoveMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface DeleteProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName?: string;
  programId?: string;
}

const DeleteProgramModal: React.FC<DeleteProgramModalProps> = ({
  isOpen,
  onClose,
  programName = 'this program',
  programId,
}) => {
  const router = useRouter();

  const deleteProgram = useMutation({
    ...programControllerRemoveMutation(),
  });

  const handleDelete = async () => {
    if (!programId) return;

    try {
      await deleteProgram.mutateAsync({
        path: { id: programId },
      });

      toast.success('Program deleted successfully!');
      onClose();
      router.push('/admin/overview');
    } catch (error: unknown) {
      const errorMessage =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || 'Failed to delete program';
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-[#DB363B]" />
            <h1 className="text-xl font-semibold text-[#DB363B]">
              Delete Program
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
          Are you sure you want to delete {programName}?
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#848595] hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteProgram.isPending}
            className="rounded-lg bg-[#DB363B] px-6 py-2 text-sm text-white transition-colors hover:bg-[#C42127] disabled:opacity-50"
          >
            {deleteProgram.isPending ? 'Deleting...' : 'Delete Program'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProgramModal;
