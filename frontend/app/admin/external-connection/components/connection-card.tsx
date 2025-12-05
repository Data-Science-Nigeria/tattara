'use client';

import { Database, Edit, Trash2 } from 'lucide-react';
import type { ExternalConnection } from '@/client/types.gen';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

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
    <div className="overflow-hidden rounded-lg border border-[#D2DDF5] bg-white p-3 sm:p-4">
      <div className="space-y-2 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:space-y-0">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex-shrink-0 rounded-lg bg-blue-50 p-1.5">
            <Database className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
              {connection.name}
            </h3>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800">
                {connection.type.toUpperCase()}
              </span>
            </div>
            <div className="mt-1 truncate text-xs text-gray-600 sm:text-sm">
              {(connection.configuration as { baseUrl?: string })?.baseUrl ||
                'No URL configured'}
            </div>
          </div>
        </div>
        <div className="flex flex-shrink-0 items-center justify-between gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
              connection.isActive
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {connection.isActive ? 'Active' : 'Inactive'}
          </span>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onEdit(connection)}
                  className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Edit connection</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onDelete(connection.id)}
                  className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>Delete connection</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
