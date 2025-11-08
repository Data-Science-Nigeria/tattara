'use client';

import { Eye, EyeOff } from 'lucide-react';
import type { ExternalConnection } from '@/client/types.gen';

interface FormError {
  message: string | string[];
}

interface ConnectionFormModalProps {
  isOpen: boolean;
  editingConnection: ExternalConnection | null;
  name: string;
  setName: (name: string) => void;
  type: string;
  setType: (type: string) => void;
  baseUrl: string;
  setBaseUrl: (url: string) => void;
  pat: string;
  setPat: (pat: string) => void;
  showToken: boolean;
  setShowToken: (show: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  error?: FormError;
}

export default function ConnectionFormModal({
  isOpen,
  editingConnection,
  name,
  setName,
  type,
  setType,
  baseUrl,
  setBaseUrl,
  pat,
  setPat,
  showToken,
  setShowToken,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: ConnectionFormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
          {editingConnection ? 'Edit Connection' : 'Create Connection'}
        </h2>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              Connection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none sm:px-3"
              placeholder="Enter connection name"
            />
          </div>
          {!editingConnection && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                Connection Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none sm:px-3"
              >
                <option value="dhis2">DHIS2</option>
              </select>
            </div>
          )}
          {!editingConnection && (
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none sm:px-3"
                placeholder="https://tattara.org.ng"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              Personal Access Token (PAT)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                className="w-full rounded border border-gray-300 px-2 py-2 pr-8 text-sm focus:border-green-500 focus:outline-none sm:px-3 sm:pr-10"
                placeholder="Enter personal access token"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-400 hover:text-gray-600 sm:right-3"
              >
                {showToken ? (
                  <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 sm:mt-4 sm:p-3">
            <p className="mb-1 text-xs font-medium text-red-600 sm:text-sm">
              Error creating connection:
            </p>
            {Array.isArray(error.message) ? (
              <ul className="list-inside list-disc space-y-1 text-xs text-red-600 sm:text-sm">
                {error.message.map((msg: string, index: number) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-red-600 sm:text-sm">
                {error.message || 'An error occurred'}
              </p>
            )}
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onCancel}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 sm:w-auto sm:border-0 sm:px-4"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={
              !name || !pat || (!editingConnection && !baseUrl) || isLoading
            }
            className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:px-4"
          >
            {isLoading && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4"></div>
            )}
            {editingConnection ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
