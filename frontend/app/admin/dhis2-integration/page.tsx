'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { externalConnectionsControllerFindAllOptions } from '@/client/@tanstack/react-query.gen';
import type { ExternalConnection } from '@/client/types.gen';
import ConnectionSelector from './components/connection-selector';
import IntegrationTabs from './components/integration-tabs';

type ApiResponse<T> = {
  success: boolean;
  data: T;
  timestamp: string;
};

export default function DHIS2Integration() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);

  const { data: connectionsResponse, isLoading } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const connections =
    (connectionsResponse as unknown as ApiResponse<ExternalConnection[]>)
      ?.data || [];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-800">
          DHIS2 Integration
        </h1>
        <p className="text-gray-600">
          Configure DHIS2 data integration and mapping
        </p>
      </div>

      <ConnectionSelector
        connections={connections}
        isLoading={isLoading}
        selectedConnectionId={selectedConnectionId}
        onConnectionSelect={setSelectedConnectionId}
      />

      {selectedConnectionId && (
        <IntegrationTabs connectionId={selectedConnectionId} />
      )}
    </div>
  );
}
