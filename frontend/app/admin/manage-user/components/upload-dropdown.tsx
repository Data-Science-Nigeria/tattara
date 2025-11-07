'use client';

import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userControllerBulkCreateMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface UploadDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  coords: { top: number; left: number; width: number };
}

export default function UploadDropdown({
  isOpen,
  onClose,
  coords,
}: UploadDropdownProps) {
  const queryClient = useQueryClient();

  const bulkCreateUsers = useMutation({
    ...userControllerBulkCreateMutation(),
  });

  const downloadTemplate = () => {
    const csvContent = 'firstName,lastName,email,password\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    onClose();
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await bulkCreateUsers.mutateAsync({});

      toast.success('Users uploaded successfully!');
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'userControllerFindAll',
      });
      onClose();
    } catch {
      toast.error('Failed to upload users');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed z-50 rounded-lg border bg-white shadow-lg"
      style={{
        top: `${coords.top + 8}px`,
        left:
          window.innerWidth < 640
            ? `${Math.max(16, (window.innerWidth - 240) / 2)}px`
            : window.innerWidth < 1024
              ? `${Math.max(16, (window.innerWidth - 320) / 2)}px`
              : `${coords.left}px`,
        width:
          window.innerWidth < 640
            ? '240px'
            : window.innerWidth < 1024
              ? '320px'
              : `${coords.width}px`,
      }}
    >
      <div>
        <button
          onClick={downloadTemplate}
          className="flex w-full items-center gap-3 rounded-t-lg px-4 py-3 text-left text-gray-600 hover:bg-green-800 hover:text-white"
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium">Download Template</p>
            <p className="hidden text-xs opacity-75 lg:block">
              Get the CSV template with the required columns
            </p>
          </div>
        </button>

        <label className="flex w-full cursor-pointer items-center gap-3 rounded-b-lg px-4 py-3 text-left text-gray-600 hover:bg-green-800 hover:text-white">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3-3m0 0l3 3m-3-3v8"
            />
          </svg>
          <div className="min-w-0">
            <p className="text-sm font-medium">Upload CSV File</p>
            <p className="hidden text-xs opacity-75 lg:block">
              Upload your completed CSV file for review
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
