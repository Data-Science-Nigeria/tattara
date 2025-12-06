'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  externalConnectionsControllerFindAllOptions,
  integrationControllerGetProgramsOptions,
  integrationControllerGetOrgUnitsOptions,
  integrationControllerGetDatasetsOptions,
} from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';

interface Connection {
  id: string;
  name: string;
  type: string;
}

interface Program {
  id: string;
  displayName?: string;
  name?: string;
}

interface OrgUnit {
  id: string;
  displayName?: string;
  name?: string;
}

interface ExternalConfig {
  connectionId: string;
  type: string;
  programId: string;
  orgUnits: string[];
  language: string;
}

interface ExternalConfigurationStepProps {
  config: ExternalConfig;
  onChange: (updates: Partial<ExternalConfig>) => void;
}

export default function DHIS2ConfigurationStep({
  config,
  onChange,
}: ExternalConfigurationStepProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: connectionsData } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const { data: programsData } = useQuery({
    ...integrationControllerGetProgramsOptions({
      path: { connectionId: config.connectionId },
      query: { page: 1, pageSize: 100 },
    }),
    enabled: !!config.connectionId && config.type === 'program',
  });

  const { data: datasetsData } = useQuery({
    ...integrationControllerGetDatasetsOptions({
      path: { connectionId: config.connectionId },
      query: { page: 1, pageSize: 100 },
    }),
    enabled: !!config.connectionId && config.type === 'dataset',
  });

  const { data: orgUnitsData } = useQuery({
    ...integrationControllerGetOrgUnitsOptions({
      path: { connectionId: config.connectionId },
      query: { type: config.type as unknown as _Object, id: config.programId },
    }),
    enabled: !!config.connectionId && !!config.programId && !!config.type,
  });

  const connections =
    (connectionsData as { data?: Connection[] })?.data?.filter(
      (conn) => conn.type === 'dhis2'
    ) || [];
  const programs =
    (programsData as { data?: { programs?: Program[] } })?.data?.programs || [];
  const datasets =
    (datasetsData as { data?: { dataSets?: Program[] } })?.data?.dataSets || [];
  const orgUnits = (orgUnitsData as { data?: OrgUnit[] })?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          External Configuration
        </h2>
        <p className="text-gray-600">
          Configure your external connection and select the target program or
          dataset
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
            Type *
          </label>
          <select
            value={config.type}
            onChange={(e) =>
              onChange({ type: e.target.value, programId: '', orgUnits: [] })
            }
            disabled={!config.connectionId}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select type...</option>
            <option value="program">Program</option>
            <option value="dataset">Dataset</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {config.type === 'dataset' ? 'Dataset' : 'Program'} *
          </label>
          <div className="relative" ref={dropdownRef}>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 ${
                !config.connectionId || !config.type
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:border-green-400'
              }`}
              onClick={() => {
                if (config.connectionId && config.type) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
            >
              <span
                className={config.programId ? 'text-gray-900' : 'text-gray-500'}
              >
                {config.programId
                  ? (config.type === 'dataset' ? datasets : programs).find(
                      (item) => item.id === config.programId
                    )?.displayName ||
                    (config.type === 'dataset' ? datasets : programs).find(
                      (item) => item.id === config.programId
                    )?.name
                  : `Select ${config.type || 'item'}...`}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            {isDropdownOpen && config.connectionId && config.type && (
              <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                {(config.type === 'dataset' ? datasets : programs).map(
                  (item) => (
                    <div
                      key={item.id}
                      className="cursor-pointer px-3 py-2 hover:bg-green-50"
                      onClick={() => {
                        onChange({ programId: item.id, orgUnits: [] });
                        setIsDropdownOpen(false);
                      }}
                    >
                      {item.displayName || item.name}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Organization Units *
        </label>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-3">
          {orgUnits.length > 0 ? (
            orgUnits.map((unit) => (
              <label key={unit.id} className="flex items-center space-x-2 py-1">
                <input
                  type="checkbox"
                  checked={config.orgUnits.includes(unit.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange({ orgUnits: [...config.orgUnits, unit.id] });
                    } else {
                      onChange({
                        orgUnits: config.orgUnits.filter(
                          (id: string) => id !== unit.id
                        ),
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm">{unit.displayName || unit.name}</span>
              </label>
            ))
          ) : (
            <p className="py-4 text-sm text-gray-500">
              {config.connectionId && config.programId
                ? 'No organization units found'
                : 'Select a connection and program to view organization units'}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Language
        </label>
        <select
          value={config.language}
          onChange={(e) => onChange({ language: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none md:w-48"
        >
          <option value="en">English</option>
          <option value="yo">Yoruba</option>
          <option value="ig">Igbo</option>
          <option value="ha">Hausa</option>
        </select>
      </div>
    </div>
  );
}
