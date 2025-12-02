'use client';

import { useState } from 'react';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Copy } from 'lucide-react';
import ConfigurationPanel from './ConfigurationPanel';
import FieldBrowser from './FieldBrowser';
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
  compulsory?: boolean;
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
  existingFields?: DataElement[];
}

export default function FieldPreviewModal({
  isOpen,
  onClose,
  onFieldsSelect,
  preSelectedConnection,
  preSelectedType,
  preSelectedProgram,
  existingFields = [],
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
          const fieldExists = existingFields.some(
            (f) => f.id === element.dataElement.id
          );
          if (!fieldExists) {
            dataElements.push({
              id: element.dataElement.id,
              name:
                element.dataElement.name ||
                element.dataElement.displayName ||
                '',
              displayName: element.dataElement.displayName,
              valueType: element.dataElement.valueType,
              description: element.dataElement.description,
              mandatory: element.compulsory || element.mandatory || false,
            });
          }
        }
      );
    });
  } else if (preSelectedType === 'dataset' && schema?.dataSetElements) {
    schema.dataSetElements.forEach((element: DataSetElement) => {
      const fieldExists = existingFields.some(
        (f) => f.id === element.dataElement.id
      );
      if (!fieldExists) {
        dataElements.push({
          id: element.dataElement.id,
          name:
            element.dataElement.name || element.dataElement.displayName || '',
          displayName: element.dataElement.displayName,
          valueType: element.dataElement.valueType,
          description: element.dataElement.description,
          mandatory: false,
        });
      }
    });
  }

  // Auto-select all available fields when data loads
  React.useEffect(() => {
    if (dataElements.length > 0 && selectedFields.length === 0) {
      setSelectedFields(dataElements);
    }
  }, [dataElements.length]);

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
            <ConfigurationPanel
              connections={connections}
              preSelectedConnection={preSelectedConnection}
              preSelectedType={preSelectedType}
              preSelectedProgram={preSelectedProgram}
              programs={programs}
              datasets={datasets}
            />

            <FieldBrowser
              dataElements={dataElements}
              filteredElements={filteredElements}
              selectedFields={selectedFields}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onFieldToggle={handleFieldToggle}
              onFieldClick={setSelectedField}
              preSelectedConnection={preSelectedConnection}
              preSelectedType={preSelectedType}
              preSelectedProgram={preSelectedProgram}
            />
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
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUseFields}
              disabled={
                selectedFields.length === 0 || dataElements.length === 0
              }
              className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
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
