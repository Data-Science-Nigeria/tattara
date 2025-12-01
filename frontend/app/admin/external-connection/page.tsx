'use client';

import React, { useState } from 'react';
import { Plus, TestTube } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  externalConnectionsControllerFindAllOptions,
  externalConnectionsControllerCreateMutation,
  externalConnectionsControllerRemoveMutation,
} from '@/client/@tanstack/react-query.gen';
import type { ExternalConnection } from '@/client/types.gen';
import { client } from '@/client/client.gen';
import ConnectionsList from './components/connections-list';
import ConnectionFormModal from './components/connection-form-modal';
import TestConnectionModal from './components/test-connection-modal';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};
export default function ExternalConnections() {
  const queryClient = useQueryClient();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingConnection, setEditingConnection] =
    useState<ExternalConnection | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState('dhis2');
  const [baseUrl, setBaseUrl] = useState('');
  const [pat, setPat] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(
    null
  );
  const [showTestModal, setShowTestModal] = useState(false);

  const { data: connections, isLoading } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
    retry: false,
  });

  const connectionsArray =
    (connections as unknown as ApiResponse<ExternalConnection[]>)?.data || [];

  const createMutation = useMutation({
    ...externalConnectionsControllerCreateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: externalConnectionsControllerFindAllOptions().queryKey,
      });
      resetForm();
      setShowCreateForm(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: {
        name: string;
        isActive: boolean;
        configuration: { baseUrl: string; pat: string };
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
      resetForm();
      setEditingConnection(null);
      setShowCreateForm(false);
    },
  });

  const deleteMutation = useMutation({
    ...externalConnectionsControllerRemoveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: externalConnectionsControllerFindAllOptions().queryKey,
      });
    },
  });

  const resetForm = () => {
    setName('');
    setBaseUrl('');
    setPat('');
    setShowToken(false);
  };

  const handleEdit = (connection: ExternalConnection) => {
    setEditingConnection(connection);
    setName(connection.name);
    setType(connection.type);
    const config = connection.configuration as {
      baseUrl?: string;
      pat?: string;
    };
    setBaseUrl(config.baseUrl || '');
    setPat(config.pat || '');
    setShowCreateForm(true);
  };

  const handleSubmit = () => {
    if (editingConnection) {
      const updatePayload = {
        name,
        isActive: true,
        configuration: { baseUrl, pat },
      };
      updateMutation.mutate({
        id: editingConnection.id,
        data: updatePayload,
      });
    } else {
      const createPayload = {
        name,
        type: type as 'dhis2',
        configuration: { baseUrl, pat },
      };
      createMutation.mutate({ body: createPayload });
    }
  };

  return (
    <div className="space-y-4 p-4 sm:space-y-6 sm:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            External Connections
          </h1>
          <p className="text-sm text-gray-600 sm:text-base">
            Manage external system connections
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-green-600 bg-white px-3 py-2 text-sm text-green-600 hover:bg-green-50 sm:px-4"
          >
            <TestTube className="h-4 w-4" />
            <span className="hidden sm:inline">Test Connection</span>
            <span className="sm:hidden">Test</span>
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingConnection(null);
              setShowCreateForm(true);
            }}
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

      <ConnectionFormModal
        isOpen={showCreateForm}
        editingConnection={editingConnection}
        name={name}
        setName={setName}
        type={type}
        setType={setType}
        baseUrl={baseUrl}
        setBaseUrl={setBaseUrl}
        pat={pat}
        setPat={setPat}
        showToken={showToken}
        setShowToken={setShowToken}
        onSubmit={handleSubmit}
        onCancel={() => {
          setShowCreateForm(false);
          setEditingConnection(null);
          resetForm();
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
        error={
          createMutation.error
            ? { message: createMutation.error.message }
            : updateMutation.error
              ? { message: updateMutation.error.message }
              : undefined
        }
      />

      <TestConnectionModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
      />

      {/* Delete Confirmation Modal */}
      {deleteConnectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-4 sm:p-6">
            <h3 className="mb-2 text-base font-semibold sm:text-lg">
              Delete Connection
            </h3>
            <p className="mb-4 text-sm text-gray-600 sm:text-base">
              Are you sure you want to delete this connection? This action
              cannot be undone.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <button
                onClick={() => setDeleteConnectionId(null)}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 sm:w-auto sm:border-0 sm:px-4"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate({ path: { id: deleteConnectionId } });
                  setDeleteConnectionId(null);
                }}
                className="w-full rounded bg-red-600 px-3 py-2 text-sm text-white hover:bg-red-700 sm:w-auto sm:px-4"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
