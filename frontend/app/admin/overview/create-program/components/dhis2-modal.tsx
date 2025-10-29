'use client';

import { Button } from '@/components/ui/button';
import { X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { externalConnectionsControllerFindAllOptions } from '@/client/@tanstack/react-query.gen';

interface DHIS2Instance {
  id: string;
  name: string;
  type: 'dhis2' | 'postgres';
  isActive: boolean;
  configuration: {
    baseUrl: string;
  };
}

interface DHIS2ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sendToDHIS2: boolean, instanceId?: string) => void;
}

export function DHIS2Modal({ isOpen, onClose, onConfirm }: DHIS2ModalProps) {
  const [sendToDHIS2, setSendToDHIS2] = useState<boolean | null>(null);
  const [selectedInstance, setSelectedInstance] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch DHIS2 instances from API
  const { data: connections, isLoading } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
    enabled: isOpen,
  });

  interface ConnectionsResponse {
    data?: DHIS2Instance[];
  }

  const dhis2Instances: DHIS2Instance[] = (connections as ConnectionsResponse)
    ?.data
    ? (connections as ConnectionsResponse).data!.filter(
        (conn) => conn.type === 'dhis2' && conn.isActive
      )
    : [];

  const handleConfirm = () => {
    if (sendToDHIS2 === null) return;
    onConfirm(sendToDHIS2, selectedInstance || undefined);
  };

  const canConfirm =
    sendToDHIS2 !== null &&
    (sendToDHIS2 === false || (selectedInstance && dhis2Instances.length > 0));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(12,16,20,0.88)] p-4 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Send Data to DHIS2
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Please confirm if data should be sent to DHIS2. If yes, select
              from available authenticated instances or connect a new one.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>

        {/* Options */}
        <div className="mb-6">
          <div className="mb-4 grid grid-cols-2 gap-4">
            {/* No Option */}
            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                sendToDHIS2 === false
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSendToDHIS2(false)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    sendToDHIS2 === false
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {sendToDHIS2 === false && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">No</p>
                  <p className="text-sm text-gray-600">
                    Data will remain in this application only.
                  </p>
                </div>
              </div>
            </div>

            {/* Yes Option */}
            <div
              className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                sendToDHIS2 === true
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSendToDHIS2(true)}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                    sendToDHIS2 === true
                      ? 'border-green-500 bg-green-500'
                      : 'border-gray-300'
                  }`}
                >
                  {sendToDHIS2 === true && (
                    <div className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800">Yes</p>
                  <p className="text-sm text-gray-600">
                    Select available authenticated instances
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* DHIS2 Instance Selection */}
          {sendToDHIS2 === true && (
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Select DHIS2 Instance
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  disabled={isLoading}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-left focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none disabled:bg-gray-100"
                >
                  <span className="text-sm">
                    {isLoading
                      ? 'Loading instances...'
                      : selectedInstance
                        ? (() => {
                            const instance = dhis2Instances.find(
                              (i) => i.id === selectedInstance
                            );
                            return instance
                              ? `${instance.name} - ${instance.configuration.baseUrl}`
                              : 'Unknown instance';
                          })()
                        : dhis2Instances.length > 0
                          ? 'Select instance'
                          : 'No DHIS2 instances available'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {showDropdown && !isLoading && (
                  <div className="absolute top-full right-0 left-0 z-10 mt-1 rounded-lg border border-gray-300 bg-white shadow-lg">
                    {dhis2Instances.length > 0 ? (
                      dhis2Instances.map((instance) => (
                        <button
                          key={instance.id}
                          onClick={() => {
                            setSelectedInstance(instance.id);
                            setShowDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm first:rounded-t-lg last:rounded-b-lg hover:bg-gray-50"
                        >
                          <div className="font-medium">{instance.name}</div>
                          <div className="text-xs text-gray-500">
                            {instance.configuration.baseUrl}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        No DHIS2 instances available
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="flex-1 rounded-lg bg-green-800 px-4 py-2 font-medium text-white transition-colors hover:bg-green-900 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
