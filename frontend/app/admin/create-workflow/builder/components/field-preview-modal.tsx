'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Minus, Search, Copy } from 'lucide-react';
import {
  externalConnectionsControllerFindAllOptions,
  integrationControllerGetProgramsOptions,
  integrationControllerGetDatasetsOptions,
  integrationControllerFetchSchemasOptions,
} from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';

interface Connection {
  id: string;
  name: string;
  type: string;
}

interface DataItem {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
}

interface DataElement {
  id: string;
  name: string;
  displayName?: string;
  valueType: string;
  description?: string;
  mandatory?: boolean;
}

interface DataSetElement {
  dataElement: DataElement;
}

interface ProgramStageDataElement {
  dataElement: DataElement;
  mandatory?: boolean;
}

interface ProgramStage {
  name?: string;
  displayName?: string;
  programStageDataElements?: ProgramStageDataElement[];
}

interface ApiResponseWithPager {
  data?: {
    programs?: DataItem[];
    dataSets?: DataItem[];
  };
}

interface SchemaResponse {
  data?: {
    programStages?: ProgramStage[];
    dataSetElements?: DataSetElement[];
  };
}

interface FieldPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFieldsSelect?: (fields: DataElement[]) => void;
  preSelectedConnection: string;
  preSelectedType: string;
  preSelectedProgram: string;
}

export default function FieldPreviewModal({
  isOpen,
  onClose,
  onFieldsSelect,
  preSelectedConnection,
  preSelectedType,
  preSelectedProgram,
}: FieldPreviewModalProps) {
  const [selectedFields, setSelectedFields] = useState<DataElement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedField, setSelectedField] = useState<DataElement | null>(null);

  const { data: connectionsData } = useQuery({
    ...externalConnectionsControllerFindAllOptions(),
  });

  const { data: programsData } = useQuery({
    ...integrationControllerGetProgramsOptions({
      path: { connectionId: preSelectedConnection },
      query: { page: 1, pageSize: 100 },
    }),
    enabled: !!preSelectedConnection && preSelectedType === 'program',
  });

  const { data: datasetsData } = useQuery({
    ...integrationControllerGetDatasetsOptions({
      path: { connectionId: preSelectedConnection },
      query: { page: 1, pageSize: 100 },
    }),
    enabled: !!preSelectedConnection && preSelectedType === 'dataset',
  });

  const { data: schemaData } = useQuery({
    ...integrationControllerFetchSchemasOptions({
      path: { connectionId: preSelectedConnection },
      query: {
        type: preSelectedType as unknown as _Object,
        id: preSelectedProgram,
      },
    }),
    enabled:
      !!preSelectedConnection && !!preSelectedProgram && !!preSelectedType,
  });

  const connections =
    (connectionsData as { data?: Connection[] })?.data?.filter(
      (conn: Connection) => conn.type === 'dhis2'
    ) || [];
  const programs = (programsData as ApiResponseWithPager)?.data?.programs || [];
  const datasets = (datasetsData as ApiResponseWithPager)?.data?.dataSets || [];

  // Extract data elements from schema
  const dataElements: DataElement[] = [];
  const schema = (schemaData as SchemaResponse)?.data;

  if (preSelectedType === 'program' && schema?.programStages) {
    schema.programStages.forEach((stage: ProgramStage) => {
      stage.programStageDataElements?.forEach(
        (element: ProgramStageDataElement) => {
          dataElements.push({
            id: element.dataElement.id,
            name:
              element.dataElement.name || element.dataElement.displayName || '',
            displayName: element.dataElement.displayName,
            valueType: element.dataElement.valueType,
            description: element.dataElement.description,
            mandatory: element.mandatory || false,
          });
        }
      );
    });
  } else if (preSelectedType === 'dataset' && schema?.dataSetElements) {
    schema.dataSetElements.forEach((element: DataSetElement) => {
      dataElements.push({
        id: element.dataElement.id,
        name: element.dataElement.name || element.dataElement.displayName || '',
        displayName: element.dataElement.displayName,
        valueType: element.dataElement.valueType,
        description: element.dataElement.description,
        mandatory: false,
      });
    });
  }

  const filteredElements = dataElements.filter(
    (element) =>
      element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      element.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFieldToggle = (field: DataElement) => {
    const isSelected = selectedFields.find((f) => f.id === field.id);
    if (isSelected) {
      setSelectedFields(selectedFields.filter((f) => f.id !== field.id));
    } else {
      setSelectedFields([...selectedFields, field]);
    }
  };

  const removeField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter((f) => f.id !== fieldId));
  };

  const handleUseFields = () => {
    onFieldsSelect?.(selectedFields);
    onClose();
  };

  const getValueTypeColor = (valueType: string) => {
    const colors = {
      TEXT: 'bg-blue-100 text-blue-800',
      NUMBER: 'bg-green-100 text-green-800',
      INTEGER: 'bg-green-100 text-green-800',
      DATE: 'bg-purple-100 text-purple-800',
      BOOLEAN: 'bg-orange-100 text-orange-800',
      TRUE_ONLY: 'bg-orange-100 text-orange-800',
    };
    return (
      colors[valueType as keyof typeof colors] || 'bg-gray-100 text-gray-800'
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-lg bg-white">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b p-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Browse DHIS2 Fields
            </h2>
            <p className="text-sm text-gray-600">
              Select fields to add to your workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="custom-scrollbar flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Configuration Panel */}
            <div className="flex-shrink-0 space-y-4 lg:col-span-1">
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="mb-4 font-medium text-gray-900">
                  Configuration
                </h3>

                {/* Pre-selected Configuration (Read-only) */}
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    DHIS2 Connection
                  </label>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                    {connections.find(
                      (conn) => conn.id === preSelectedConnection
                    )?.name || 'Loading...'}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700 capitalize">
                    {preSelectedType || 'Loading...'}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {preSelectedType === 'dataset' ? 'Dataset' : 'Program'}
                  </label>
                  <div className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                    {(() => {
                      const items =
                        preSelectedType === 'dataset' ? datasets : programs;
                      const selectedItem = items.find(
                        (item) => item.id === preSelectedProgram
                      );
                      return (
                        selectedItem?.displayName ||
                        selectedItem?.name ||
                        'Loading...'
                      );
                    })()}
                  </div>
                </div>

                <div className="rounded bg-blue-50 p-2 text-xs text-gray-500">
                  💡 To change these settings, go back to the DHIS2
                  Configuration step
                </div>
              </div>

              {/* Selected Fields */}
              {selectedFields.length > 0 && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="mb-3 font-medium text-gray-900">
                    Selected ({selectedFields.length})
                  </h3>

                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {selectedFields.map((field) => (
                      <div
                        key={field.id}
                        className="flex items-center justify-between rounded border bg-white p-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {field.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {field.valueType}
                          </p>
                        </div>
                        <button
                          onClick={() => removeField(field.id)}
                          className="ml-2 text-sm text-red-600 hover:text-red-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Field Browser */}
            <div className="lg:col-span-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">
                    Available Fields
                  </h3>
                  {dataElements.length > 0 && (
                    <div className="relative">
                      <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {preSelectedConnection &&
                preSelectedType &&
                preSelectedProgram ? (
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {filteredElements.map((element) => (
                      <div
                        key={element.id}
                        className="cursor-pointer rounded-lg border border-gray-200 bg-white p-3 hover:bg-gray-50"
                        onClick={() => setSelectedField(element)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-medium text-gray-900">
                              {element.name}
                            </h4>
                            <p className="truncate text-sm text-gray-500">
                              ID: {element.id}
                            </p>
                            {element.description && (
                              <p className="mt-1 line-clamp-2 text-sm text-gray-600">
                                {element.description}
                              </p>
                            )}
                          </div>
                          <div className="ml-3 flex items-center gap-2">
                            {element.mandatory && (
                              <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                                Required
                              </span>
                            )}
                            <span
                              className={`rounded px-2 py-1 text-xs ${getValueTypeColor(element.valueType)}`}
                            >
                              {element.valueType}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFieldToggle(element);
                              }}
                              className={`rounded p-1 ${
                                selectedFields.find((f) => f.id === element.id)
                                  ? 'text-red-600 hover:bg-red-100'
                                  : 'text-green-600 hover:bg-green-100'
                              }`}
                            >
                              {selectedFields.find(
                                (f) => f.id === element.id
                              ) ? (
                                <Minus className="h-4 w-4" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredElements.length === 0 &&
                      dataElements.length > 0 && (
                        <p className="py-8 text-center text-gray-500">
                          No fields found matching your search.
                        </p>
                      )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-20 text-gray-500">
                    <p>
                      Select a connection, type, and {preSelectedType || 'item'}{' '}
                      to browse available fields
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between border-t bg-gray-50 p-6">
          <div className="text-sm text-gray-600">
            {selectedFields.length} field
            {selectedFields.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedFields([])}
              disabled={selectedFields.length === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUseFields}
              disabled={selectedFields.length === 0}
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Use Selected Fields
            </button>
          </div>
        </div>

        {/* Field Details Modal */}
        {selectedField && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold">Field Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <p className="text-gray-900">{selectedField.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    ID
                  </label>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm text-gray-900">
                      {selectedField.id}
                    </p>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(selectedField.id)
                      }
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <span
                    className={`inline-block rounded px-2 py-1 text-xs ${getValueTypeColor(selectedField.valueType)}`}
                  >
                    {selectedField.valueType}
                  </span>
                </div>
                {selectedField.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <p className="text-sm text-gray-900">
                      {selectedField.description}
                    </p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedField(null)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleFieldToggle(selectedField);
                    setSelectedField(null);
                  }}
                  className={`rounded px-4 py-2 ${
                    selectedFields.find((f) => f.id === selectedField.id)
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {selectedFields.find((f) => f.id === selectedField.id)
                    ? 'Remove Field'
                    : 'Add Field'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
