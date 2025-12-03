'use client';

import { useQuery } from '@tanstack/react-query';
import { integrationControllerFetchSchemasOptions } from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';
import { useEffect, useState } from 'react';

interface Field {
  id: string;
  label?: string;
  fieldName?: string;
  fieldType: string;
  dhis2DataElement?: string;
}

interface DataElement {
  id: string;
  name?: string;
  displayName?: string;
  valueType: string;
}

interface ProgramStageDataElement {
  dataElement: DataElement;
}

interface ProgramStage {
  programStageDataElements?: ProgramStageDataElement[];
}

interface DataSetElement {
  dataElement: DataElement;
}

interface SchemaData {
  programStages?: ProgramStage[];
  dataElements?: DataElement[];
  dataSetElements?: DataSetElement[];
}

interface FieldMappingStepProps {
  selectedConnection: string;
  selectedProgram: string;
  selectedType: 'program' | 'dataSet' | '';
  fields: Field[];
  updateField: (id: string, updates: Partial<Field>) => void;
  onValidationChange?: (hasErrors: boolean) => void;
}

export default function FieldMappingStep({
  selectedConnection,
  selectedProgram,
  selectedType,
  fields,
  updateField,
  onValidationChange,
}: FieldMappingStepProps) {
  const [dhis2DataElements, setDhis2DataElements] = useState<DataElement[]>([]);

  // Validate field name matching
  const isFieldNameMatching = (
    workflowFieldName: string,
    dhis2FieldName: string
  ): boolean => {
    const normalize = (name: string) =>
      name.toLowerCase().replace(/[^a-z0-9]/g, '');
    return normalize(workflowFieldName) === normalize(dhis2FieldName);
  };

  // Export validation for parent components
  const hasValidationErrors = fields.some((field) => {
    if (!field.dhis2DataElement) return false;
    const dhis2Element = dhis2DataElements.find(
      (el) => el.id === field.dhis2DataElement
    );
    const workflowFieldName = field.label || field.fieldName || '';
    return (
      dhis2Element &&
      !isFieldNameMatching(workflowFieldName, dhis2Element.name || '')
    );
  });

  // Pass validation status to parent
  useEffect(() => {
    onValidationChange?.(hasValidationErrors);
  }, [hasValidationErrors, onValidationChange]);

  const getFieldValidation = (field: Field) => {
    if (!field.dhis2DataElement) return { isValid: true, message: '' };

    const dhis2Element = dhis2DataElements.find(
      (el) => el.id === field.dhis2DataElement
    );
    if (!dhis2Element) return { isValid: true, message: '' };

    const workflowFieldName = field.label || field.fieldName || '';
    const isMatching = isFieldNameMatching(
      workflowFieldName,
      dhis2Element.name || ''
    );
    return {
      isValid: isMatching,
      message: isMatching
        ? ''
        : `Field name '${workflowFieldName}' does not match DHIS2 field '${dhis2Element.name}'`,
    };
  };

  // Get list of already selected data elements
  const selectedDataElements = fields
    .map((field) => field.dhis2DataElement)
    .filter(Boolean) as string[];

  const {
    data: schemaData,
    error,
    isLoading,
  } = useQuery({
    ...integrationControllerFetchSchemasOptions({
      path: { connectionId: selectedConnection },
      query: {
        type: selectedType as unknown as _Object,
        id: selectedProgram as string,
      },
    }),
    enabled: !!selectedConnection && !!selectedProgram && !!selectedType,
  });

  useEffect(() => {
    if (schemaData) {
      const schema = (schemaData as { data: SchemaData })?.data;

      if (schema?.programStages) {
        const elements: DataElement[] = [];
        schema.programStages.forEach((stage) => {
          if (stage.programStageDataElements) {
            stage.programStageDataElements.forEach((element) => {
              elements.push({
                id: element.dataElement.id,
                name:
                  element.dataElement.name || element.dataElement.displayName,
                valueType: element.dataElement.valueType,
              });
            });
          }
        });
        setDhis2DataElements(elements);
      } else if (schema?.dataSetElements) {
        // Handle dataset elements structure
        const elements = schema.dataSetElements.map((element) => ({
          id: element.dataElement.id,
          name: element.dataElement.name || element.dataElement.displayName,
          valueType: element.dataElement.valueType,
        }));
        setDhis2DataElements(elements);
      } else if (schema?.dataElements) {
        // Handle direct data elements structure
        const elements = schema.dataElements.map((element) => ({
          id: element.id,
          name: element.name || element.displayName,
          valueType: element.valueType,
        }));
        setDhis2DataElements(elements);
      }
    }
  }, [schemaData, error, isLoading]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-red-900">
            DHIS2 Connection Not Found
          </h3>
          <p className="mb-3 text-sm text-red-700">
            The workflow is configured for DHIS2 but no external connection was
            found. You need to:
          </p>
          <ol className="mb-3 list-inside list-decimal space-y-1 text-sm text-red-700">
            <li>Go to Admin → External Connections</li>
            <li>Create a DHIS2 connection</li>
            <li>Re-configure this workflow to use the connection</li>
          </ol>
          <button
            onClick={() =>
              (window.location.href = '/admin/external-connection')
            }
            className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
          >
            Go to External Connections
          </button>
        </div>
      )}

      {!selectedConnection && (
        <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <h3 className="mb-2 text-sm font-medium text-yellow-900">
            Missing Connection
          </h3>
          <p className="text-sm text-yellow-700">
            No DHIS2 connection found for this workflow. Please configure DHIS2
            integration first.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="rounded-lg border border-gray-200 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-medium text-gray-900">
                {field.label || field.fieldName}
              </h4>
              <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                {field.fieldType}
              </span>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Map to DHIS2 Data Element
              </label>
              <select
                value={field.dhis2DataElement || ''}
                onChange={(e) =>
                  updateField(field.id, { dhis2DataElement: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 focus:outline-none ${
                  getFieldValidation(field).isValid
                    ? 'border-gray-300 focus:border-green-500'
                    : 'border-red-500 bg-red-50 focus:border-red-500'
                }`}
                disabled={!selectedConnection || isLoading}
              >
                <option value="">Select data element...</option>
                {dhis2DataElements.length === 0 &&
                  !isLoading &&
                  selectedConnection && (
                    <option value="" disabled>
                      No data elements found
                    </option>
                  )}
                {isLoading && (
                  <option value="" disabled>
                    Loading data elements...
                  </option>
                )}
                {!selectedConnection && (
                  <option value="" disabled>
                    Configure DHIS2 connection first
                  </option>
                )}
                {dhis2DataElements.map((element) => {
                  const isAlreadySelected =
                    selectedDataElements.includes(element.id) &&
                    field.dhis2DataElement !== element.id;
                  const workflowFieldName =
                    field.label || field.fieldName || '';
                  const isMatching = isFieldNameMatching(
                    workflowFieldName,
                    element.name || ''
                  );
                  return (
                    <option
                      key={element.id}
                      value={element.id}
                      disabled={isAlreadySelected}
                      style={
                        !isMatching
                          ? { color: '#dc2626', fontStyle: 'italic' }
                          : {}
                      }
                    >
                      {element.name} ({element.valueType})
                      {isAlreadySelected ? ' - Already mapped' : ''}
                      {!isMatching ? ' - Name mismatch' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
            {!getFieldValidation(field).isValid && (
              <div className="mt-2 text-sm text-red-600">
                ⚠️ {getFieldValidation(field).message}
              </div>
            )}
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No fields created yet. Go back to create fields first.
        </div>
      )}
    </div>
  );
}
