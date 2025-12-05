'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  externalConnectionsControllerCreateMutation,
  integrationControllerTestConnectionMutation,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

export default function AddConnectionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('dhis2');
  const [baseUrl, setBaseUrl] = useState('');
  const [pat, setPat] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [testError, setTestError] = useState<string>();

  const createMutation = useMutation({
    ...externalConnectionsControllerCreateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['external-connections'],
      });
      toast.success('Connection created successfully!');
      router.push('/admin/external-connection');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create connection');
    },
  });

  const testConnectionMutation = useMutation({
    ...integrationControllerTestConnectionMutation(),
  });

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestError(undefined);
    setConnectionTested(false);

    try {
      await testConnectionMutation.mutateAsync({
        body: {
          type: type as 'dhis2',
          config: { baseUrl, pat },
        },
      });
      setConnectionTested(true);
    } catch (error: unknown) {
      setTestError((error as Error)?.message || 'Connection test failed');
      setConnectionTested(false);
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSubmit = async () => {
    const createPayload = {
      name,
      type: type as 'dhis2',
      configuration: { baseUrl, pat },
    };
    createMutation.mutate({ body: createPayload });
  };

  return (
    <div className="space-y-6 p-8">
      {/* Back Button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft size={20} />
          Back
        </Button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Create Connection
        </h1>
      </div>

      {/* Form */}
      <div className="max-w-4xl">
        <div className="space-y-6">
          {/* Connection Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Connection Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter connection name"
              className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
            />
          </div>

          {/* Connection Type */}
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Connection Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
            >
              <option value="dhis2">DHIS2</option>
            </select>
          </div>

          {/* Base URL and Personal Access Token */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Base URL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Base URL
              </label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://tattara.org.ng"
                className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
              />
            </div>

            {/* Personal Access Token */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Personal Access Token (PAT)
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={pat}
                  onChange={(e) => setPat(e.target.value)}
                  placeholder="Enter personal access token"
                  className="w-full rounded-lg border border-[#D2DDF5] bg-white px-3 py-2 pr-10 focus:border-[#008647] focus:ring-2 focus:ring-green-500 focus:outline-none"
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

          {/* Test Connection Section */}
          <div className="rounded-lg border border-[#D2DDF5] bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Test Connection
                </p>
                <p className="text-xs text-gray-500">
                  Verify your credentials before creating
                </p>
              </div>
              <Button
                onClick={handleTestConnection}
                disabled={!name || !pat || !baseUrl || isTestingConnection}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isTestingConnection && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isTestingConnection ? 'Testing...' : 'Test Connection'}
              </Button>
            </div>
            {connectionTested && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-sm text-green-600">Connection successful!</p>
              </div>
            )}
            {testError && (
              <div className="mt-3 flex items-start gap-2">
                <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-500"></div>
                <p className="text-sm text-red-600">{testError}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              onClick={() => router.push('/admin/external-connection')}
              className="w-full rounded-lg border-2 border-green-800 bg-white px-4 py-2 font-medium text-green-800 transition-colors hover:bg-green-800 hover:text-white sm:w-auto sm:px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !name ||
                !pat ||
                !baseUrl ||
                !connectionTested ||
                createMutation.isPending
              }
              className="w-full rounded-lg bg-green-800 px-4 py-2 font-medium text-white transition-colors hover:bg-green-900 sm:w-auto sm:px-6"
            >
              {createMutation.isPending ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                'Create Connection'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
