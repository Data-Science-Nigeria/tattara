'use client';

import { useState, useEffect } from 'react';
import { Trash2, GripVertical, Eye } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  integrationControllerFetchSchemasOptions,
  fieldControllerRemoveWorkflowFieldMutation,
} from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';

interface DataElement {
  id: string;
  name?: string;
  displayName?: string;
  valueType: string;
  description?: string;
}

interface ProgramStageDataElement {
  dataElement: DataElement;
  compulsory?: boolean;
  mandatory?: boolean;
}

interface ProgramStage {
  programStageDataElements?: ProgramStageDataElement[];
}

interface DataSetElement {
  dataElement: DataElement;
}

interface SchemaData {
  programStages?: ProgramStage[];
  dataSetElements?: DataSetElement[];
}

interface AvailableField {
  id: string;
  name: string;
  displayName?: string;
  valueType: string;
  description?: string;
  mandatory: boolean;
}

interface AIField {
  id: string;
  fieldName: string;
  label: string;
  fieldType: string;
  isRequired: boolean;
  displayOrder: number;
  aiPrompt: string;
  externalDataElement?: string;
  options?: string[];
}

interface ExternalConfig {
  connectionId: string;
  type: string;
  programId: string;
  programStageId?: string;
  datasetId?: string;
  orgUnit: string;
}

interface AIFieldMappingStepProps {
  inputType: 'text' | 'audio' | 'image';
  fields: AIField[];
  setFields: (fields: AIField[]) => void;
  externalConfig: ExternalConfig;
  workflowId?: string;
}

export default function AIFieldMappingStep({
  inputType,
  fields,
  setFields,
  externalConfig,
  workflowId,
}: AIFieldMappingStepProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [optionsInputs, setOptionsInputs] = useState<Record<string, string>>(
    {}
  );

  const isEditMode = !!workflowId;

  const deleteFieldMutation = useMutation({
    ...fieldControllerRemoveWorkflowFieldMutation(),
    onSuccess: () => {
      toast.success('Field deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete field');
    },
  });

  useEffect(() => {
    const newInputs: Record<string, string> = {};
    fields.forEach((field) => {
      if (
        (field.fieldType === 'select' || field.fieldType === 'multiselect') &&
        field.options
      ) {
        newInputs[field.id] = field.options.join(', ');
      }
    });
    setOptionsInputs(newInputs);
  }, [fields.length]);

  const { data: schemaData } = useQuery({
    ...integrationControllerFetchSchemasOptions({
      path: { connectionId: externalConfig.connectionId },
      query: {
        type: externalConfig.type as unknown as _Object,
        id:
          (externalConfig.type === 'dataset'
            ? externalConfig.datasetId
            : externalConfig.programId) || '',
      },
    }),
    enabled:
      !!externalConfig.connectionId &&
      !!(externalConfig.type === 'dataset'
        ? externalConfig.datasetId
        : externalConfig.programId) &&
      !!externalConfig.type,
  });

  // Extract available fields from schema
  const availableFields: AvailableField[] = [];
  const schema = (schemaData as { data?: SchemaData })?.data;

  if (externalConfig.type === 'program' && schema?.programStages) {
    schema.programStages.forEach((stage) => {
      stage.programStageDataElements?.forEach((element) => {
        availableFields.push({
          id: element.dataElement.id,
          name:
            element.dataElement.name || element.dataElement.displayName || '',
          displayName: element.dataElement.displayName,
          valueType: element.dataElement.valueType,
          description: element.dataElement.description,
          mandatory: element.compulsory || element.mandatory || false,
        });
      });
    });
  } else if (externalConfig.type === 'dataset' && schema?.dataSetElements) {
    schema.dataSetElements.forEach((element) => {
      availableFields.push({
        id: element.dataElement.id,
        name: element.dataElement.name || element.dataElement.displayName || '',
        displayName: element.dataElement.displayName,
        valueType: element.dataElement.valueType,
        description: element.dataElement.description,
        mandatory: false,
      });
    });
  }

  const addFieldsFromExternal = () => {
    const newFields = availableFields
      .filter(
        (field) =>
          !fields.find(
            (f) =>
              f.externalDataElement === field.id ||
              f.fieldName === field.name.toLowerCase().replace(/\s+/g, '_')
          )
      )
      .map((field, index) => ({
        id: Date.now().toString() + index,
        fieldName: field.name.toLowerCase().replace(/\s+/g, '_'),
        label: field.name,
        fieldType: mapValueTypeToFieldType(field.valueType),
        isRequired: field.mandatory || false,
        displayOrder: fields.length + index + 1,
        aiPrompt: getDefaultPrompt(field.name, inputType),
        externalDataElement: field.id,
      }));

    setFields([...fields, ...newFields]);
  };

  const mapValueTypeToFieldType = (valueType: string): string => {
    switch (valueType) {
      case 'NUMBER':
      case 'INTEGER':
      case 'INTEGER_ZERO_OR_POSITIVE':
        return 'number';
      case 'DATE':
        return 'date';
      case 'DATETIME':
        return 'datetime';
      case 'BOOLEAN':
      case 'TRUE_ONLY':
        return 'boolean';
      case 'EMAIL':
        return 'email';
      case 'PHONE_NUMBER':
        return 'phone';
      case 'URL':
        return 'url';
      case 'LONG_TEXT':
        return 'textarea';
      default:
        return 'text';
    }
  };

  const getDefaultPrompt = (
    fieldName: string,
    inputType: string,
    options?: string[]
  ): string => {
    const fieldLower = fieldName.toLowerCase();
    let basePrompt = '';
    switch (inputType) {
      case 'text':
        basePrompt = `Extract ${fieldLower} from the provided text input`;
        break;
      case 'audio':
        basePrompt = `Extract ${fieldLower} from the audio recording transcription`;
        break;
      case 'image':
        basePrompt = `Extract ${fieldLower} from the uploaded image using OCR`;
        break;
      default:
        basePrompt = `Extract ${fieldLower} from the input`;
    }

    if (options && options.length > 0) {
      basePrompt += `. Only extract values that match these options: ${options.join(', ')}`;
    }

    return basePrompt;
  };

  const updateField = (id: string, updates: Partial<AIField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const isUUID = (id: string): boolean => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  const removeField = async (id: string) => {
    if (isEditMode && isUUID(id)) {
      await deleteFieldMutation.mutateAsync({
        path: { fieldId: id },
      });
    }
    setFields(fields.filter((field) => field.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          AI Field Mapping
        </h2>
        <p className="text-gray-600">
          Configure AI prompts for extracting data from {inputType} input
        </p>
      </div>

      <div className="flex gap-3">
        {availableFields.length > 0 && (
          <button
            onClick={addFieldsFromExternal}
            className="flex items-center gap-2 rounded-lg border border-green-600 px-4 py-2 text-green-600 hover:bg-green-50"
          >
            <Eye className="h-4 w-4" />
            Add External Fields (
            {
              availableFields.filter(
                (field) =>
                  !fields.find(
                    (f) =>
                      f.externalDataElement === field.id ||
                      f.fieldName ===
                        field.name.toLowerCase().replace(/\s+/g, '_')
                  )
              ).length
            }{' '}
            available)
          </button>
        )}
        {!isEditMode && fields.length > 0 && (
          <button
            onClick={() => setFields([])}
            className="flex items-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="relative rounded-lg border border-gray-200 p-4"
            draggable
            onDragStart={() => setDraggedIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (draggedIndex === null || draggedIndex === index) return;
              const newFields = [...fields];
              const draggedField = newFields[draggedIndex];
              newFields.splice(draggedIndex, 1);
              newFields.splice(index, 0, draggedField);
              const updatedFields = newFields.map((f, i) => ({
                ...f,
                displayOrder: i + 1,
              }));
              setFields(updatedFields);
              setDraggedIndex(null);
            }}
          >
            <div className="absolute top-4 left-2 cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical size={16} />
            </div>

            <div className="ml-6 space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={field.fieldName}
                    onChange={(e) =>
                      updateField(field.id, { fieldName: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Label
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) =>
                      updateField(field.id, { label: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Field Type
                  </label>
                  <select
                    value={field.fieldType}
                    onChange={(e) =>
                      updateField(field.id, { fieldType: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="datetime">DateTime</option>
                    <option value="boolean">Boolean</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="url">URL</option>
                    <option value="textarea">Long Text</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-Select</option>
                  </select>
                </div>

                <div className="flex items-end justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.isRequired}
                      onChange={(e) =>
                        updateField(field.id, { isRequired: e.target.checked })
                      }
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                  <button
                    onClick={() => removeField(field.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {(field.fieldType === 'select' ||
                field.fieldType === 'multiselect') && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={optionsInputs[field.id] || ''}
                    onChange={(e) => {
                      setOptionsInputs((prev) => ({
                        ...prev,
                        [field.id]: e.target.value,
                      }));
                    }}
                    onBlur={(e) => {
                      const value = e.target.value;
                      const options = value
                        ? value
                            .split(',')
                            .map((o) => o.trim())
                            .filter((o) => o)
                        : [];
                      updateField(field.id, {
                        options,
                        aiPrompt: getDefaultPrompt(
                          field.fieldName,
                          inputType,
                          options
                        ),
                      });
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="e.g., Option 1, Option 2, Option 3"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  AI Extraction Prompt
                </label>
                <textarea
                  value={field.aiPrompt}
                  onChange={(e) =>
                    updateField(field.id, { aiPrompt: e.target.value })
                  }
                  onBlur={(e) => {
                    if (
                      !e.target.value &&
                      (field.fieldType === 'select' ||
                        field.fieldType === 'multiselect') &&
                      field.options
                    ) {
                      updateField(field.id, {
                        aiPrompt: getDefaultPrompt(
                          field.fieldName,
                          inputType,
                          field.options
                        ),
                      });
                    }
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  rows={3}
                  placeholder={getDefaultPrompt(
                    field.fieldName,
                    inputType,
                    field.options
                  )}
                />
              </div>

              {field.externalDataElement && (
                <div className="rounded bg-blue-50 p-2 text-xs text-blue-700">
                  External Data Element: {field.externalDataElement}
                </div>
              )}
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <p>
              No fields configured yet. Add fields from external system or
              create custom fields.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
