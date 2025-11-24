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
    <div className="overflow-hidden rounded-lg border bg-white p-1.5 sm:p-2 md:p-3 lg:p-4">
      <div className="space-y-1.5 sm:flex sm:items-center sm:justify-between sm:gap-2 sm:space-y-0">
        <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
          <Database className="h-3 w-3 flex-shrink-0 text-gray-500 sm:h-4 sm:w-4" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-xs leading-tight font-medium">
              {connection.name}
            </h3>
            <div className="space-y-0.5 text-xs text-gray-500 sm:space-y-0">
              <div className="truncate">{connection.type.toUpperCase()}</div>
              <div className="truncate text-xs">
                {(connection.configuration as { baseUrl?: string })?.baseUrl ||
                  'No URL'}
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-between gap-1">
          <span
            className={`rounded px-1 py-0.5 text-xs leading-none ${
              connection.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {connection.isActive ? 'Active' : 'Inactive'}
          </span>
          <div className="flex items-center">
            <button
              onClick={() => onEdit(connection)}
              className="p-0.5 text-gray-500 hover:text-blue-600"
            >
              <Edit className="h-3 w-3" />
            </button>
            <button
              onClick={() => onDelete(connection.id)}
              className="p-0.5 text-gray-500 hover:text-red-600"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
