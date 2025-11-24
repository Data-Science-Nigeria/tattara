'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { integrationControllerTestConnectionMutation } from '@/client/@tanstack/react-query.gen';

interface TestConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TestConnectionModal({
  isOpen,
  onClose,
}: TestConnectionModalProps) {
  const [type, setType] = useState('dhis2');
  const [baseUrl, setBaseUrl] = useState('');
  const [pat, setPat] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const testMutation = useMutation({
    ...integrationControllerTestConnectionMutation(),
    onSuccess: () => {
      setTestResult({ success: true, message: 'Connection successful!' });
    },
    onError: (error: Error) => {
      setTestResult({
        success: false,
        message: error.message || 'Connection failed',
      });
    },
  });

  const handleTest = () => {
    setTestResult(null);
    testMutation.mutate({
      body: {
        type: type as 'dhis2',
        config: {
          baseUrl,
          pat,
        },
      },
    });
  };

  const resetForm = () => {
    setType('dhis2');
    setBaseUrl('');
    setPat('');
    setShowToken(false);
    setTestResult(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
          Test Connection
        </h2>

        <div className="space-y-3 sm:space-y-4">
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

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 sm:text-sm">
              Base URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded border border-gray-300 px-2 py-2 text-sm focus:border-green-500 focus:outline-none sm:px-3"
              placeholder="https://dhis2tattara.org.ng/api"
            />
          </div>

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

          {testResult && (
            <div
              className={`rounded p-2 text-xs sm:p-3 sm:text-sm ${
                testResult.success
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 sm:w-auto sm:border-0 sm:px-4"
          >
            Close
          </button>
          <button
            onClick={handleTest}
            disabled={!baseUrl || !pat || testMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:px-4"
          >
            {testMutation.isPending && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent sm:h-4 sm:w-4"></div>
            )}
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
}
