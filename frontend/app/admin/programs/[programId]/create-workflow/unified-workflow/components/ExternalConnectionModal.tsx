'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { externalConnectionsControllerFindAllOptions } from '@/client/@tanstack/react-query.gen';

interface Connection {
  id: string;
  name: string;
  type: string;
}

interface ExternalConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    useExternal: boolean,
    connectionId?: string,
    connectionType?: string
  ) => void;
}

export default function ExternalConnectionModal({
  isOpen,
  onClose,
  onConfirm,
}: ExternalConnectionModalProps) {
  const [useExternal, setUseExternal] = useState<boolean | null>(null);
  const [selectedConnection, setSelectedConnection] = useState('');

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setUseExternal(null);
      setSelectedConnection('');
    }
  }, [isOpen]);

  const { data: connectionsData } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
    enabled: isOpen,
  });

  const connections = (connectionsData as { data?: Connection[] })?.data || [];

  const handleConfirm = () => {
    if (useExternal === null) return;
    const connectionType = connections.find(
      (c) => c.id === selectedConnection
    )?.type;
    onConfirm(
      useExternal,
      useExternal ? selectedConnection : undefined,
      connectionType
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
      <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
        <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl">
          Send Data to External System
        </h2>
        <p className="mb-6 text-sm text-gray-600 sm:text-base">
          Please confirm if data should be sent to an external system. If yes,
          select from available authenticated instances.
        </p>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div
            onClick={() => setUseExternal(false)}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              useExternal === false
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-green-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                  useExternal === false
                    ? 'border-green-600 bg-green-600'
                    : 'border-gray-300'
                }`}
              >
                {useExternal === false && (
                  <div className="h-full w-full scale-50 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">No</h3>
                <p className="text-sm text-gray-600">
                  Don&apos;t send to external system
                </p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setUseExternal(true)}
            className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
              useExternal === true
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-gray-50 hover:border-green-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 h-4 w-4 flex-shrink-0 rounded-full border-2 ${
                  useExternal === true
                    ? 'border-green-600 bg-green-600'
                    : 'border-gray-300'
                }`}
              >
                {useExternal === true && (
                  <div className="h-full w-full scale-50 rounded-full bg-white"></div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Yes</h3>
                <p className="text-sm text-gray-600">Send to external system</p>
              </div>
            </div>
          </div>
        </div>

        {useExternal === true && (
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select External Connection
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
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <button
            onClick={onClose}
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:text-gray-800 sm:w-auto sm:border-0 sm:px-4"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={
              useExternal === null ||
              (useExternal === true && !selectedConnection)
            }
            className="flex w-full items-center justify-center gap-2 rounded bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:px-4"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
