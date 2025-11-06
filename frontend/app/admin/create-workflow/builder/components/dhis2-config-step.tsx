'use client';

import { useQuery } from '@tanstack/react-query';
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
  const { data: connectionsData } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const { data: programsData } = useQuery({
    ...integrationControllerGetProgramsOptions({
      path: { connectionId: selectedConnection },
      query: { page: 1, pageSize: 50 },
    }),
    enabled: !!selectedConnection && selectedType === 'program',
  });

  const { data: datasetsData } = useQuery({
    ...integrationControllerGetDatasetsOptions({
      path: { connectionId: selectedConnection },
      query: { page: 1, pageSize: 50 },
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            External Connection
          </label>
          <select
            value={selectedConnection}
            onChange={(e) => setSelectedConnection(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
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
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none disabled:opacity-50"
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
          <select
            value={selectedProgram}
            onChange={(e) => setSelectedProgram(e.target.value)}
            disabled={!selectedConnection || !selectedType}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select {selectedType || 'item'}...</option>
            {(selectedType === 'dataset' ? datasets : programs).map((item) => (
              <option key={item.id} value={item.id}>
                {item.displayName || item.name}
              </option>
            ))}
          </select>
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
