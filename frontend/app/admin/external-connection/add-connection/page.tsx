'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  externalConnectionsControllerCreateMutation,
  integrationControllerTestConnectionMutation,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import DHIS2Form from '../components/dhis2-form';
import PostgreSQLForm from '../components/postgresql-form';

export default function AddConnectionPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [type, setType] = useState('dhis2');
  const [baseUrl, setBaseUrl] = useState('');
  const [pat, setPat] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
      const config =
        type === 'dhis2'
          ? { baseUrl, pat }
          : { host, port: parseInt(port), database, username, password };

      await testConnectionMutation.mutateAsync({
        body: {
          type: type as 'dhis2' | 'postgres',
          config,
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
    const configuration =
      type === 'dhis2'
        ? { baseUrl, pat }
        : { host, port: parseInt(port), database, username, password };

    const createPayload = {
      name,
      type: type as 'dhis2' | 'postgres',
      configuration,
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
              onChange={(e) => {
                const value = e.target.value.replace(/[^a-zA-Z0-9 ]/g, '');
                setName(value);
              }}
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
              <option value="postgres">PostgreSQL</option>
            </select>
          </div>

          {/* Connection Configuration */}
          {type === 'dhis2' ? (
            <DHIS2Form
              baseUrl={baseUrl}
              setBaseUrl={setBaseUrl}
              pat={pat}
              setPat={setPat}
              onTestConnection={handleTestConnection}
              isTestingConnection={isTestingConnection}
              connectionTested={connectionTested}
              testError={testError}
              name={name}
            />
          ) : (
            <PostgreSQLForm
              host={host}
              setHost={setHost}
              port={port}
              setPort={setPort}
              database={database}
              setDatabase={setDatabase}
              username={username}
              setUsername={setUsername}
              password={password}
              setPassword={setPassword}
              onTestConnection={handleTestConnection}
              isTestingConnection={isTestingConnection}
              connectionTested={connectionTested}
              testError={testError}
              name={name}
            />
          )}

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
                (type === 'dhis2'
                  ? !pat || !baseUrl
                  : !host || !database || !username || !password) ||
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
