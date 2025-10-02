'use client';

import { CircleX } from 'lucide-react';
import React from 'react';

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,16,20,0.88)] p-4 backdrop-blur-sm">
      <div className="w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl rounded-3xl bg-white p-4 sm:p-6 md:p-8 lg:p-10">
        <div className="mb-4 sm:mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-[#2F3A4C]">
              Create Program
            </h1>
            <p className="text-xs sm:text-sm text-[#7987A0]">
              Create a new program for users follow
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
            <CircleX className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>
        <form className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
          <div>
            <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-gray-600">
              Title
            </label>
            <input
              type="text"
              placeholder="Enter your Title"
              className="w-full rounded-xl border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-2 sm:py-3 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-gray-600">
              Description
            </label>
            <textarea
              placeholder="Description"
              rows={3}
              className="w-full rounded-xl border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-2 sm:py-3 text-sm focus:border-green-500 focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="mb-1 sm:mb-2 block text-xs sm:text-sm font-medium text-gray-600">
              Assign User
            </label>
            <input
              type="text"
              placeholder="Assign User"
              className="w-full rounded-xl border border-[#BAC7DF] bg-[#FAFAFA] px-3 py-2 sm:py-3 text-sm focus:border-green-500 focus:outline-none"
            />
          </div>
        </form>
        <div className="flex justify-end">
          <div className="flex gap-2 sm:gap-4">
            <button 
              onClick={onClose}
              className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-[#999AAA] hover:text-gray-700"
            >
              Cancel
            </button>
            <button className="rounded-xl bg-green-800 px-4 sm:px-6 py-2 sm:py-3 text-sm text-white hover:bg-green-900 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProgramModal;