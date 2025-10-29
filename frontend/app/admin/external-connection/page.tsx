'use client';

import React, { useState } from 'react';
import { Plus, TestTube } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  externalConnectionsControllerFindAllOptions,
  externalConnectionsControllerCreateMutation,
  externalConnectionsControllerRemoveMutation,
  externalConnectionsControllerUpdateMutation,
} from '@/client/@tanstack/react-query.gen';
import type { ExternalConnection } from '@/client/types.gen';
import ConnectionsList from './components/connections-list';
import ConnectionFormModal from './components/connection-form-modal';
import TestConnectionModal from '../dhis2-integration/components/test-connection-modal';

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

  const { data: connectionsResponse, isLoading } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const connections =
    (connectionsResponse as unknown as ExternalConnection[]) || [];

  const createMutation = useMutation({
    ...externalConnectionsControllerCreateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['externalConnectionsControllerFindAll'],
      });
      resetForm();
      setShowCreateForm(false);
    },
  });

  const updateMutation = useMutation({
    ...externalConnectionsControllerUpdateMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['externalConnectionsControllerFindAll'],
      });
      resetForm();
      setEditingConnection(null);
    },
  });

  const deleteMutation = useMutation({
    ...externalConnectionsControllerRemoveMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['externalConnectionsControllerFindAll'],
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
      updateMutation.mutate({
        path: { id: editingConnection.id },
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
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            External Connections
          </h1>
          <p className="text-gray-600">Manage external system connections</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-2 rounded-lg border border-green-600 bg-white px-4 py-2 text-green-600 hover:bg-green-50"
          >
            <TestTube className="h-4 w-4" />
            Test Connection
          </button>
          <button
            onClick={() => {
              resetForm();
              setEditingConnection(null);
              setShowCreateForm(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Add Connection
          </button>
        </div>
      </div>

      <ConnectionsList
        connections={connections}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-lg bg-white p-6">
            <h3 className="mb-2 text-lg font-semibold">Delete Connection</h3>
            <p className="mb-4 text-gray-600">
              Are you sure you want to delete this connection? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConnectionId(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteMutation.mutate({ path: { id: deleteConnectionId } });
                  setDeleteConnectionId(null);
                }}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
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
