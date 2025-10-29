'use client';

import ConnectionCard from './connection-card';
import type { ExternalConnection } from '@/client/types.gen';

interface ConnectionsListProps {
  connections: ExternalConnection[];
  isLoading: boolean;
  onEdit: (connection: ExternalConnection) => void;
  onDelete: (id: string) => void;
}

export default function ConnectionsList({
  connections,
  isLoading,
  onEdit,
  onDelete,
}: ConnectionsListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!Array.isArray(connections) || connections.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-gray-500">No connections found</p>
        <p className="text-sm text-gray-400">
          Create your first connection to get started
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.id}
          connection={connection}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
