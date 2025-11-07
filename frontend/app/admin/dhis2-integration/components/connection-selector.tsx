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
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-center sm:p-6">
        <Database className="mx-auto h-10 w-10 text-gray-400 sm:h-12 sm:w-12" />
        <h3 className="mt-2 text-base font-medium text-gray-900 sm:text-lg">
          No connections found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Create a DHIS2 connection first to configure integration
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
      <h2 className="mb-4 text-base font-medium text-gray-900 sm:text-lg">
        Select Connection
      </h2>
      <div className="grid gap-2 sm:gap-3">
        {connections.map((connection) => (
          <button
            key={connection.id}
            onClick={() => onConnectionSelect(connection.id)}
            className={`flex items-center gap-2 overflow-hidden rounded-lg border p-2 text-left transition-colors sm:gap-3 sm:p-3 ${
              selectedConnectionId === connection.id
                ? 'border-green-500 bg-green-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Database className="h-4 w-4 flex-shrink-0 text-gray-500 sm:h-5 sm:w-5" />
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="truncate text-xs break-all text-gray-500 sm:text-sm">
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
