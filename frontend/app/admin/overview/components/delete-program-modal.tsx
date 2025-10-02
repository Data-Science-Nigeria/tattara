'use client';

import { Trash2, X } from 'lucide-react';
import React from 'react';

interface DeleteProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  programName?: string;
}

const DeleteProgramModal: React.FC<DeleteProgramModalProps> = ({ 
  isOpen, 
  onClose, 
  programName = 'this program' 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,16,20,0.88)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <Trash2 className="h-6 w-6 text-[#DB363B]" />
            <h1 className="text-xl font-semibold text-[#DB363B]">
              Delete Program
            </h1>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-[#848595] mb-8">
          Are you sure you want to delete {programName}?
        </p>
        
        <div className="flex justify-end gap-4">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#848595] hover:text-gray-700"
          >
            Cancel
          </button>
          <button className="rounded-lg bg-[#DB363B] px-6 py-2 text-sm text-white hover:bg-[#C42127] transition-colors">
            Delete Program
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProgramModal;