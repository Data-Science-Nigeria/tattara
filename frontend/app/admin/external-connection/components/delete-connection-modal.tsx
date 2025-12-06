'use client';

import { Trash2, X } from 'lucide-react';
import React from 'react';

interface DeleteConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  connectionName?: string;
  isDeleting?: boolean;
}

const DeleteConnectionModal: React.FC<DeleteConnectionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  connectionName = 'this connection',
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-[#DB363B]" />
            <h1 className="text-xl font-semibold text-[#DB363B]">
              Delete Connection
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
          Are you sure you want to delete {connectionName}?
        </p>

        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#848595] hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="rounded-lg bg-[#DB363B] px-6 py-2 text-sm text-white transition-colors hover:bg-[#C42127] disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Connection'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConnectionModal;
