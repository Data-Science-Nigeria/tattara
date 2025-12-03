'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/use-auth-store';

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
  const { auth } = useAuthStore();

  const downloadTemplate = () => {
    const csvContent =
      'firstName,lastName,email,password\nJohn,Doe,john@example.com,Password123@';
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

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/bulk/create`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        if (error.errors && error.errors.length > 0) {
          error.errors.forEach((err: string) => toast.error(err));
        } else {
          toast.error(error.message || 'Failed to upload users');
        }
        return;
      }

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
