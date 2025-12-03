'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  externalConnectionsControllerFindAllOptions,
  integrationControllerGetProgramsOptions,
  integrationControllerGetOrgUnitsOptions,
  integrationControllerGetDatasetsOptions,
} from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';

interface DHIS2ConfigStepProps {
  selectedConnection: string;
  setSelectedConnection: (value: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
  selectedProgram: string;
  setSelectedProgram: (value: string) => void;
  selectedOrgUnits: string[];
  setSelectedOrgUnits: (value: string[]) => void;
}

export default function DHIS2ConfigStep({
  selectedConnection,
  setSelectedConnection,
  selectedType,
  setSelectedType,
  selectedProgram,
  setSelectedProgram,
  selectedOrgUnits,
  setSelectedOrgUnits,
}: DHIS2ConfigStepProps) {
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

  useEffect(() => {
    setSelectedOrgUnits([]);
  }, [selectedConnection, selectedType, selectedProgram, setSelectedOrgUnits]);

  const { data: connectionsData } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const { data: programsData } = useQuery({
    ...integrationControllerGetProgramsOptions({
      path: { connectionId: selectedConnection },
      query: { page: 1, pageSize: 100 },
    }),
    enabled: !!selectedConnection && selectedType === 'program',
  });

  const { data: datasetsData } = useQuery({
    ...integrationControllerGetDatasetsOptions({
      path: { connectionId: selectedConnection },
      query: { page: 1, pageSize: 100 },
    }),
    enabled: !!selectedConnection && selectedType === 'dataset',
  });

  const { data: orgUnitsData } = useQuery({
    ...integrationControllerGetOrgUnitsOptions({
      path: { connectionId: selectedConnection },
      query: { type: selectedType as unknown as _Object, id: selectedProgram },
    }),
    enabled: !!selectedConnection && !!selectedProgram && !!selectedType,
  });

  interface Connection {
    id: string;
    name: string;
  }

  interface Program {
    id: string;
    name?: string;
    displayName?: string;
  }

  interface OrgUnit {
    id: string;
    name?: string;
    displayName?: string;
  }

  const connections = (connectionsData as { data?: Connection[] })?.data || [];
  const programs =
    (programsData as { data?: { programs?: Program[] } })?.data?.programs || [];
  const datasets =
    (datasetsData as { data?: { dataSets?: Program[] } })?.data?.dataSets || [];
  const orgUnits = (orgUnitsData as { data?: OrgUnit[] })?.data || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-[1.5fr_1fr_3fr] lg:gap-8">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            External Connection
          </label>
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none sm:text-base"
          >
            <option value="">Select connection...</option>
            {connections.map((conn) => (
              <option key={conn.id} value={conn.id}>
                {conn.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            disabled={!selectedConnection}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none disabled:opacity-50 sm:text-base"
          >
            <option value="">Select type...</option>
            <option value="program">Program</option>
            <option value="dataset">Dataset</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            {selectedType === 'dataset' ? 'Dataset' : 'Program'}
          </label>
          <div className="relative" ref={dropdownRef}>
            <div
              className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 sm:text-base ${
                !selectedConnection || !selectedType
                  ? 'cursor-not-allowed opacity-50'
                  : 'hover:border-green-400'
              }`}
              onClick={() => {
                if (selectedConnection && selectedType) {
                  setIsDropdownOpen(!isDropdownOpen);
                }
              }}
            >
              <span
                className={selectedProgram ? 'text-gray-900' : 'text-gray-500'}
              >
                {selectedProgram
                  ? (selectedType === 'dataset' ? datasets : programs).find(
                      (item) => item.id === selectedProgram
                    )?.displayName ||
                    (selectedType === 'dataset' ? datasets : programs).find(
                      (item) => item.id === selectedProgram
                    )?.name
                  : `Select ${selectedType || 'item'}...`}
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  isDropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
            {isDropdownOpen && selectedConnection && selectedType && (
              <div className="absolute top-full z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
                {(selectedType === 'dataset' ? datasets : programs).map(
                  (item) => (
                    <div
                      key={item.id}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-green-50 sm:text-base"
                      onClick={() => {
                        setSelectedProgram(item.id);
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
          Organization Units
        </label>
        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 p-3">
          {orgUnits.map((unit) => (
            <label key={unit.id} className="flex items-center space-x-2 py-1">
              <input
                type="checkbox"
                checked={selectedOrgUnits.includes(unit.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedOrgUnits([...selectedOrgUnits, unit.id]);
                  } else {
                    setSelectedOrgUnits(
                      selectedOrgUnits.filter((id) => id !== unit.id)
                    );
                  }
                }}
                className="rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm">{unit.displayName || unit.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
