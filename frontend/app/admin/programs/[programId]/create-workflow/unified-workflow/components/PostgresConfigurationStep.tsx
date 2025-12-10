'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  externalConnectionsControllerFindAllOptions,
  integrationControllerFetchSchemasOptions,
} from '@/client/@tanstack/react-query.gen';

interface Connection {
  id: string;
  name: string;
  type: string;
}

interface PostgresConfig {
  connectionId: string;
  schema: string;
  table: string;
}

interface PostgresConfigurationStepProps {
  config: PostgresConfig;
  onChange: (updates: Partial<PostgresConfig>) => void;
}

export default function PostgresConfigurationStep({
  config,
  onChange,
}: PostgresConfigurationStepProps) {
  const [isSchemaDropdownOpen, setIsSchemaDropdownOpen] = useState(false);
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState(false);
  const schemaDropdownRef = useRef<HTMLDivElement>(null);
  const tableDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        schemaDropdownRef.current &&
        !schemaDropdownRef.current.contains(event.target as Node)
      ) {
        setIsSchemaDropdownOpen(false);
      }
      if (
        tableDropdownRef.current &&
        !tableDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTableDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: connectionsData } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const { data: schemasData } = useQuery({
    ...integrationControllerFetchSchemasOptions({
      path: { connectionId: config.connectionId },
      query: {},
    }),
    enabled: !!config.connectionId,
  });

  const connections =
    (connectionsData as { data?: Connection[] })?.data?.filter(
      (conn) => conn.type === 'postgres'
    ) || [];

  const schemas = schemasData
    ? Object.keys(
        (schemasData as { data?: Record<string, unknown> })?.data || {}
      )
    : [];

  const tables =
    config.schema && schemasData
      ? Object.keys(
          (
            (schemasData as { data?: Record<string, Record<string, unknown>> })
              ?.data?.[config.schema] as { tables?: Record<string, unknown> }
          )?.tables || {}
        )
      : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          PostgreSQL Configuration
        </h2>
        <p className="text-gray-600">
          Configure your PostgreSQL connection and select the target schema and
          table
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            External Connection *
          </label>
          <input
            type="text"
            value={
              connections.find((conn) => conn.id === config.connectionId)
                ?.name || ''
            }
            readOnly
            className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Schema *
          </label>
          <div className="relative" ref={schemaDropdownRef}>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 ${
                !config.connectionId
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:border-green-400'
              }`}
              onClick={() => {
                if (config.connectionId) {
                  setIsSchemaDropdownOpen(!isSchemaDropdownOpen);
                }
              }}
            >
              <span
                className={`truncate ${config.schema ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {config.schema || 'Select schema...'}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isSchemaDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            {isSchemaDropdownOpen && config.connectionId && (
              <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                {schemas.map((schema) => (
                  <div
                    key={schema}
                    className="cursor-pointer px-3 py-2 hover:bg-green-50"
                    onClick={() => {
                      onChange({ schema, table: '' });
                      setIsSchemaDropdownOpen(false);
                    }}
                  >
                    {schema}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Table *
          </label>
          <div className="relative" ref={tableDropdownRef}>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 ${
                !config.schema
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:border-green-400'
              }`}
              onClick={() => {
                if (config.schema) {
                  setIsTableDropdownOpen(!isTableDropdownOpen);
                }
              }}
            >
              <span
                className={`truncate ${config.table ? 'text-gray-900' : 'text-gray-500'}`}
              >
                {config.table || 'Select table...'}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isTableDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            {isTableDropdownOpen && config.schema && (
              <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                {tables.map((table) => (
                  <div
                    key={table}
                    className="cursor-pointer px-3 py-2 hover:bg-green-50"
                    onClick={() => {
                      onChange({ table });
                      setIsTableDropdownOpen(false);
                    }}
                  >
                    {table}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
