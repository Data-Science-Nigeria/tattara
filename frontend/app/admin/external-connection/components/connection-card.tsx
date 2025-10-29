'use client';

import { Database, Edit, Trash2 } from 'lucide-react';
import type { ExternalConnection } from '@/client/types.gen';

interface ConnectionCardProps {
  connection: ExternalConnection;
  onEdit: (connection: ExternalConnection) => void;
  onDelete: (id: string) => void;
}

export default function ConnectionCard({
  connection,
  onEdit,
  onDelete,
}: ConnectionCardProps) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-gray-500" />
          <div>
            <h3 className="font-medium">{connection.name}</h3>
            <p className="text-sm text-gray-500">
              {connection.type.toUpperCase()} •{' '}
              {(connection.configuration as { baseUrl?: string })?.baseUrl ||
                'No URL'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded px-2 py-1 text-xs ${
              connection.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {connection.isActive ? 'Active' : 'Inactive'}
          </span>
          <button
            onClick={() => onEdit(connection)}
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(connection.id)}
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
