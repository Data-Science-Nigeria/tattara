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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold">Test Connection</h2>

        <div className="space-y-4">
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Base URL
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              placeholder="https://dhis2tattara.org.ng/api"
            />
          </div>

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

          {testResult && (
            <div
              className={`rounded p-3 text-sm ${
                testResult.success
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Close
          </button>
          <button
            onClick={handleTest}
            disabled={!baseUrl || !pat || testMutation.isPending}
            className="flex items-center gap-2 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {testMutation.isPending && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            )}
            Test Connection
          </button>
        </div>
      </div>
    </div>
  );
}
