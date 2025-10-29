'use client';

import { Database } from 'lucide-react';
import type { ExternalConnection } from '@/client/types.gen';

interface ConnectionSelectorProps {
  connections: ExternalConnection[];
  isLoading: boolean;
  selectedConnectionId: string | null;
  onConnectionSelect: (id: string) => void;
}

export default function ConnectionSelector({
  connections,
  isLoading,
  selectedConnectionId,
  onConnectionSelect,
}: ConnectionSelectorProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!connections.length) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <Database className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No connections found
        </h3>
        <p className="mt-1 text-gray-500">
          Create a DHIS2 connection first to configure integration
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-medium text-gray-900">
        Select Connection
      </h2>
      <div className="grid gap-3">
        {connections.map((connection) => (
          <button
            key={connection.id}
            onClick={() => onConnectionSelect(connection.id)}
            className={`flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
              selectedConnectionId === connection.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Database className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">
                {(connection.configuration as { baseUrl?: string })?.baseUrl ||
                  'No URL configured'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
