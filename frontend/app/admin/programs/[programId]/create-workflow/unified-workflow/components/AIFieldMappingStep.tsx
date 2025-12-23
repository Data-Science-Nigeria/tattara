'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Trash2,
  GripVertical,
  Eye,
  Plus,
  Download,
  Upload,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { integrationControllerFetchSchemasOptions } from '@/client/@tanstack/react-query.gen';
import { _Object } from '@/client/types.gen';
import {
  validateCSV,
  generateErrorReport,
  CSVValidationError,
} from '@/lib/csv-validation';
import { toast } from 'sonner';

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

interface PostgresColumn {
  name: string;
  type: string;
  nullable: boolean;
}

interface PostgresTable {
  name: string;
  columns?: PostgresColumn[];
}

interface PostgresSchema {
  name: string;
  tables?: PostgresTable[];
}

interface PostgresSchemaData {
  data?: PostgresSchema[] | { columns?: PostgresColumn[] };
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
  connectionType?: string;
  type: string;
  programId: string;
  programStageId?: string;
  datasetId?: string;
  orgUnit: string;
  schema?: string;
  table?: string;
}

interface AIFieldMappingStepProps {
  inputType: 'text' | 'audio' | 'image';
  fields: AIField[];
  setFields: (fields: AIField[]) => void;
  externalConfig: ExternalConfig;
  isEditMode?: boolean;
  onDeleteField?: (fieldId: string) => void;
}

export default function AIFieldMappingStep({
  inputType,
  fields,
  setFields,
  externalConfig,
  isEditMode = false,
  onDeleteField,
}: AIFieldMappingStepProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [optionsInputs, setOptionsInputs] = useState<Record<string, string>>(
    {}
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isPostgres = externalConfig.connectionType === 'postgres';

  const { data: schemaData } = useQuery({
    ...integrationControllerFetchSchemasOptions({
      path: { connectionId: externalConfig.connectionId },
      query: isPostgres
        ? {}
        : {
            type: externalConfig.type as unknown as _Object,
            id:
              (externalConfig.type === 'dataset'
                ? externalConfig.datasetId
                : externalConfig.programId) || '',
          },
    }),
    enabled: isPostgres
      ? !!externalConfig.connectionId &&
        !!externalConfig.schema &&
        !!externalConfig.table
      : !!externalConfig.connectionId &&
        !!(externalConfig.type === 'dataset'
          ? externalConfig.datasetId
          : externalConfig.programId) &&
        !!externalConfig.type,
  });

  // Extract available fields from schema
  const availableFields: AvailableField[] = [];
  const schema = (schemaData as { data?: SchemaData })?.data;

  if (isPostgres && externalConfig.schema && externalConfig.table) {
    // PostgreSQL: Extract columns from table
    let columns: Array<{ name: string; type: string; nullable: boolean }> = [];

    const postgresData = schemaData as PostgresSchemaData;

    // Handle direct table columns response (manual entry)
    if (postgresData?.data && 'columns' in postgresData.data) {
      columns = postgresData.data.columns || [];
    }
    // Handle schema list response (dropdown selection)
    else if (postgresData?.data && Array.isArray(postgresData.data)) {
      const schema = postgresData.data.find(
        (s) => s.name === externalConfig.schema
      );
      const table = schema?.tables?.find(
        (t) => t.name === externalConfig.table
      );
      columns = table?.columns || [];
    }

    columns.forEach((column) => {
      availableFields.push({
        id: column.name,
        name: column.name,
        displayName: column.name,
        valueType: column.type,
        description: undefined,
        mandatory: !column.nullable,
      });
    });
  } else if (externalConfig.type === 'program' && schema?.programStages) {
    // DHIS2 Program
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
    // DHIS2 Dataset
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
            (f) => f.fieldName === field.name.toLowerCase().replace(/\s+/g, '_')
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
        externalDataElement: '',
      }));

    setFields([...fields, ...newFields]);
  };

  const mapValueTypeToFieldType = (valueType: string): string => {
    const type = valueType.toUpperCase();
    // PostgreSQL types
    if (
      type.includes('INT') ||
      type.includes('SERIAL') ||
      type.includes('NUMERIC') ||
      type.includes('DECIMAL') ||
      type.includes('FLOAT') ||
      type.includes('DOUBLE')
    ) {
      return 'number';
    }
    if (type.includes('DATE') && !type.includes('TIME')) {
      return 'date';
    }
    if (type.includes('TIMESTAMP') || type.includes('DATETIME')) {
      return 'datetime';
    }
    if (type.includes('BOOL')) {
      return 'boolean';
    }
    if (type === 'TEXT') {
      return 'text';
    }
    if (type.includes('VARCHAR') && valueType.length > 255) {
      return 'textarea';
    }
    // DHIS2 types
    switch (type) {
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
      case 'TEXT':
        return 'text';
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

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const addManualField = () => {
    const field: AIField = {
      id: Date.now().toString(),
      fieldName: 'new_field',
      label: 'New Field',
      fieldType: 'text',
      isRequired: false,
      displayOrder: fields.length + 1,
      aiPrompt: getDefaultPrompt('New Field', inputType),
      externalDataElement: '',
      options: [],
    };
    setFields([...fields, field]);
  };

  const downloadCSV = () => {
    const headers = [
      'name',
      'label',
      'type',
      'required',
      'options',
      'aiPrompt',
    ];
    const exampleRow = [
      'patient_name',
      'Patient Name',
      'text',
      'true',
      '',
      'Extract patient name from the input',
    ];
    const selectExampleRow = [
      'gender',
      'Gender',
      'select',
      'true',
      'Male,Female,Other',
      'Extract gender from the provided options',
    ];

    const csvContent = [headers, exampleRow, selectExampleRow]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-field-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;

      // Validate CSV
      const validation = validateCSV(csv);

      if (!validation.isValid) {
        const errorCount = validation.errors.filter(
          (e) => e.severity === 'error'
        ).length;
        const warningCount = validation.errors.filter(
          (e) => e.severity === 'warning'
        ).length;

        toast.error(
          `CSV validation failed: ${errorCount} errors, ${warningCount} warnings`,
          {
            description: 'Click to download detailed error report',
            action: {
              label: 'Download Report',
              onClick: () => downloadErrorReport(validation.errors),
            },
          }
        );
        return;
      }

      // Show warnings if any
      const warnings = validation.errors.filter(
        (e) => e.severity === 'warning'
      );
      if (warnings.length > 0) {
        toast.warning(`${warnings.length} warnings found in CSV`, {
          description: 'File uploaded but please review warnings',
          action: {
            label: 'Download Report',
            onClick: () => downloadErrorReport(warnings),
          },
        });
      }

      // Process valid data
      const newFields: AIField[] = validation.data.map((row, index) => {
        const options = row.options
          ? row.options
              .split(',')
              .map((o: string) => o.trim())
              .filter((o: string) => o)
          : [];

        return {
          id: Date.now().toString() + index,
          fieldName: row.name || `field_${index + 1}`,
          label: row.label || `Field ${index + 1}`,
          fieldType: row.type || 'text',
          isRequired: ['true', '1'].includes(row.required?.toLowerCase()),
          displayOrder: fields.length + index + 1,
          aiPrompt:
            row.aiPrompt ||
            getDefaultPrompt(
              row.name || `field_${index + 1}`,
              inputType,
              options
            ),
          externalDataElement: '',
          options,
        };
      });

      if (newFields.length > 0) {
        setFields([...fields, ...newFields]);
        toast.success(
          `Successfully imported ${newFields.length} fields from CSV`
        );
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadErrorReport = (errors: CSVValidationError[]) => {
    const report = generateErrorReport(errors);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'csv-validation-errors.txt';
    a.click();
    URL.revokeObjectURL(url);
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

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {availableFields.length > 0 && (
          <button
            onClick={addFieldsFromExternal}
            className="flex items-center gap-2 rounded-lg border border-green-600 px-4 py-2 text-green-600 hover:bg-green-50"
          >
            <Eye className="hidden h-4 w-4 sm:inline" />
            Add External Fields (
            {
              availableFields.filter(
                (field) =>
                  !fields.find(
                    (f) =>
                      f.fieldName ===
                      field.name.toLowerCase().replace(/\s+/g, '_')
                  )
              ).length
            }{' '}
            available)
          </button>
        )}
        {(availableFields.length === 0 ||
          (isPostgres && !externalConfig.table)) && (
          <>
            <button
              onClick={addManualField}
              className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Field</span>
              <span className="sm:hidden">Add</span>
            </button>
            <button
              onClick={downloadCSV}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download CSV Template</span>
              <span className="sm:hidden">Download</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Upload CSV</span>
              <span className="sm:hidden">Upload</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </>
        )}
        {!isEditMode && fields.length > 0 && (
          <button
            onClick={() => setFields([])}
            className="flex items-center justify-center gap-2 rounded-lg border border-red-600 px-4 py-2 text-red-600 hover:bg-red-50"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                    onClick={() =>
                      onDeleteField
                        ? onDeleteField(field.id)
                        : removeField(field.id)
                    }
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
                    value={
                      optionsInputs[field.id] ||
                      (field.options ? field.options.join(', ') : '')
                    }
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
