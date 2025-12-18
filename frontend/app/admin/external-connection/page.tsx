'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  externalConnectionsControllerFindAllOptions,
  externalConnectionsControllerRemoveMutation,
  integrationControllerTestConnectionMutation,
} from '@/client/@tanstack/react-query.gen';
import type { ExternalConnection } from '@/client/types.gen';
import { client } from '@/client/client.gen';
import ConnectionsList from './components/connections-list';
import EditFormModal from './components/edit-form-modal';
import DeleteConnectionModal from './components/delete-connection-modal';
import { toast } from 'sonner';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};
export default function ExternalConnections() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editingConnection, setEditingConnection] =
    useState<ExternalConnection | null>(null);
  const [name, setName] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [pat, setPat] = useState('');
  const [host, setHost] = useState('');
  const [port, setPort] = useState('5432');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(
    null
  );

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTested, setConnectionTested] = useState(false);
  const [testError, setTestError] = useState<string>();

  const { data: connections, isLoading } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
    retry: false,
  });

  const connectionsArray =
    (connections as unknown as ApiResponse<ExternalConnection[]>)?.data || [];

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        isActive: boolean;
        configuration:
          | { baseUrl: string; pat: string }
          | {
              host: string;
              port: number;
              database: string;
              username: string;
              password: string;
            };
      };
    }) => {
      const response = await client.patch({
        url: `/api/v1/external-connections/${id}`,
        body: data,
        headers: {
          'Content-Type': 'application/json',
        },
        throwOnError: true,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: externalConnectionsControllerFindAllOptions().queryKey,
      });
      toast.success('Connection updated successfully!');
      resetForm();
      setEditingConnection(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update connection');
    },
  });

  const deleteMutation = useMutation({
    ...externalConnectionsControllerRemoveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: externalConnectionsControllerFindAllOptions().queryKey,
      });
      toast.success('Connection deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete connection');
    },
  });

  const testConnectionMutation = useMutation({
    ...integrationControllerTestConnectionMutation(),
  });

  const resetForm = () => {
    setName('');
    setBaseUrl('');
    setPat('');
    setHost('');
    setPort('5432');
    setDatabase('');
    setUsername('');
    setPassword('');
    setConnectionTested(false);
    setTestError(undefined);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestError(undefined);
    setConnectionTested(false);

    try {
      const config =
        editingConnection?.type === 'dhis2'
          ? { baseUrl, pat }
          : { host, port: parseInt(port), database, username, password };

      await testConnectionMutation.mutateAsync({
        body: {
          type:
            (editingConnection?.type as 'dhis2' | 'postgres' | 'mysql') ||
            'dhis2',
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

  const handleEdit = (connection: ExternalConnection) => {
    setEditingConnection(connection);
    setName(connection.name);

    if (connection.type === 'dhis2') {
      const config = connection.configuration as {
        baseUrl?: string;
        pat?: string;
      };
      setBaseUrl(config.baseUrl || '');
      setPat(config.pat || '');
    } else {
      const config = connection.configuration as {
        host?: string;
        port?: number;
        database?: string;
        username?: string;
        password?: string;
      };
      setHost(config.host || '');
      setPort(config.port?.toString() || '5432');
      setDatabase(config.database || '');
      setUsername(config.username || '');
      setPassword(config.password || '');
    }

    setConnectionTested(false);
    setTestError(undefined);
  };

  const handleSubmit = () => {
    const configuration =
      editingConnection?.type === 'dhis2'
        ? { baseUrl, pat }
        : { host, port: parseInt(port), database, username, password };

    const updatePayload = {
      name,
      isActive: true,
      configuration,
    };
    updateMutation.mutate({
      id: editingConnection!.id,
      data: updatePayload,
    });
  };

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            External Connections
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={() =>
              router.push('/admin/external-connection/add-connection')
            }
            className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 sm:px-4"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Connection</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      <ConnectionsList
        connections={connectionsArray}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={(id) => setDeleteConnectionId(id)}
      />

      {editingConnection && (
        <EditFormModal
          isOpen={true}
          connectionType={
            editingConnection.type as 'dhis2' | 'postgres' | 'mysql'
          }
          name={name}
          setName={setName}
          baseUrl={baseUrl}
          setBaseUrl={setBaseUrl}
          pat={pat}
          setPat={setPat}
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
          onSubmit={handleSubmit}
          onCancel={() => {
            setEditingConnection(null);
            resetForm();
          }}
          onTestConnection={handleTestConnection}
          isLoading={updateMutation.isPending}
          isTestingConnection={isTestingConnection}
          connectionTested={connectionTested}
          testError={testError}
          error={
            updateMutation.error
              ? { message: updateMutation.error.message }
              : undefined
          }
        />
      )}

      <DeleteConnectionModal
        isOpen={!!deleteConnectionId}
        onClose={() => setDeleteConnectionId(null)}
        onConfirm={() => {
          if (deleteConnectionId) {
            deleteMutation.mutate({ path: { id: deleteConnectionId } });
            setDeleteConnectionId(null);
          }
        }}
        connectionName={
          connectionsArray.find((c) => c.id === deleteConnectionId)?.name
        }
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
