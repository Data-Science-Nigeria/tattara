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
      (conn) => conn.type === 'postgres' || conn.type === 'mysql'
    ) || [];

  const schemas = schemasData
    ? (
        schemasData as {
          data?: Array<{ name: string; tables: Array<{ name: string }> }>;
        }
      )?.data || []
    : [];

  const selectedSchema = schemas.find((s) => s.name === config.schema);
  const tables = selectedSchema?.tables || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Database Configuration
        </h2>
        <p className="text-gray-600">
          Configure your database connection and select the target schema and
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
                    key={schema.name}
                    className="cursor-pointer px-3 py-2 hover:bg-green-50"
                    onClick={() => {
                      onChange({ schema: schema.name, table: '' });
                      setIsSchemaDropdownOpen(false);
                    }}
                  >
                    {schema.name}
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
          {!config.schema ? (
            <div className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-gray-500">
              Select a schema first
            </div>
          ) : tables.length > 0 ? (
            <div className="space-y-2">
              <div className="relative" ref={tableDropdownRef}>
                <div
                  className="flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-3 py-2 hover:border-green-400 focus:border-green-500"
                  onClick={() => setIsTableDropdownOpen(!isTableDropdownOpen)}
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
                {isTableDropdownOpen && (
                  <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                    {tables.map((table) => (
                      <div
                        key={table.name}
                        className="cursor-pointer px-3 py-2 hover:bg-green-50"
                        onClick={() => {
                          onChange({ table: table.name });
                          setIsTableDropdownOpen(false);
                        }}
                      >
                        {table.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {config.table && (
                <button
                  type="button"
                  onClick={() => onChange({ table: '' })}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Clear and enter manually
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mb-2 text-xs text-gray-500">
                No tables found in schema. Enter table name manually:
              </div>
              <input
                type="text"
                value={config.table}
                onChange={(e) => onChange({ table: e.target.value })}
                placeholder="Enter table name"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
          )}
          {!config.table && tables.length > 0 && (
            <div className="mt-2">
              <input
                type="text"
                value=""
                onChange={(e) => onChange({ table: e.target.value })}
                placeholder="Or enter table name manually"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
