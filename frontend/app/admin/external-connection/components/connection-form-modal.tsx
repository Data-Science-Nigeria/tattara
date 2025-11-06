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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">
          {editingConnection ? 'Edit Connection' : 'Create Connection'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Connection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              placeholder="Enter connection name"
            />
          </div>
          {!editingConnection && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Connection Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              >
                <option value="dhis2">DHIS2</option>
              </select>
            </div>
          )}
          {!editingConnection && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                placeholder="https://tattara.org.ng"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Personal Access Token (PAT)
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={pat}
                onChange={(e) => setPat(e.target.value)}
                className="w-full rounded border border-gray-300 px-3 py-2 pr-10 focus:border-green-500 focus:outline-none"
                placeholder="Enter personal access token"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        {error && (
          <div className="mt-4 rounded border border-red-200 bg-red-50 p-3">
            <p className="mb-1 text-sm font-medium text-red-600">
              Error creating connection:
            </p>
            {Array.isArray(error.message) ? (
              <ul className="list-inside list-disc space-y-1 text-sm text-red-600">
                {error.message.map((msg: string, index: number) => (
                  <li key={index}>{msg}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-red-600">
                {error.message || 'An error occurred'}
              </p>
            )}
          </div>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={
              !name || !pat || (!editingConnection && !baseUrl) || isLoading
            }
            className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            )}
            {editingConnection ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
}
