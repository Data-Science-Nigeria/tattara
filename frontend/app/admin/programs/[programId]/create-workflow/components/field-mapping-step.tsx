'use client';

import { useQuery } from '@tanstack/react-query';
import { integrationControllerFetchSchemasOptions } from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';
import { useEffect, useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

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
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>(
    {}
  );
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      Object.keys(dropdownRefs.current).forEach((fieldId) => {
        const ref = dropdownRefs.current[fieldId];
        if (ref && !ref.contains(event.target as Node)) {
          setOpenDropdowns((prev) => ({ ...prev, [fieldId]: false }));
        }
      });
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDropdown = (fieldId: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className="rounded-lg border border-[#D2DDF5] bg-white p-4"
          >
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
              <div
                className="relative"
                ref={(el) => {
                  dropdownRefs.current[field.id] = el;
                }}
              >
                <div
                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg border border-[#D2DDF5] bg-transparent px-3 py-2 text-sm focus:border-green-500 sm:text-base ${
                    !selectedConnection || isLoading
                      ? 'cursor-not-allowed opacity-50'
                      : 'hover:border-green-400'
                  }`}
                  onClick={() => {
                    if (selectedConnection && !isLoading) {
                      toggleDropdown(field.id);
                    }
                  }}
                >
                  <span
                    className={
                      field.dhis2DataElement ? 'text-gray-900' : 'text-gray-500'
                    }
                  >
                    {field.dhis2DataElement
                      ? dhis2DataElements.find(
                          (el) => el.id === field.dhis2DataElement
                        )?.name || 'Select data element...'
                      : 'Select data element...'}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      openDropdowns[field.id] ? 'rotate-180' : ''
                    }`}
                  />
                </div>
                {openDropdowns[field.id] &&
                  selectedConnection &&
                  !isLoading && (
                    <div className="custom-scrollbar absolute bottom-full z-50 mb-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-lg">
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
                          <div
                            key={element.id}
                            className={`cursor-pointer px-3 py-2 text-sm hover:bg-green-50 sm:text-base ${
                              isAlreadySelected
                                ? 'cursor-not-allowed opacity-50'
                                : ''
                            } ${!isMatching ? 'text-red-600 italic' : ''}`}
                            onClick={() => {
                              if (!isAlreadySelected) {
                                updateField(field.id, {
                                  dhis2DataElement: element.id,
                                });
                                setOpenDropdowns((prev) => ({
                                  ...prev,
                                  [field.id]: false,
                                }));
                              }
                            }}
                          >
                            {element.name} ({element.valueType})
                            {isAlreadySelected ? ' - Already mapped' : ''}
                            {!isMatching ? ' - Name mismatch' : ''}
                          </div>
                        );
                      })}
                    </div>
                  )}
              </div>
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
