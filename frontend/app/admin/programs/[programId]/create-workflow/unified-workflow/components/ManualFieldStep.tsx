'use client';

import { useState, useRef } from 'react';
import { Plus, Trash2, GripVertical, Download, Upload } from 'lucide-react';
import {
  validateCSV,
  generateErrorReport,
  CSVValidationError,
} from '@/lib/csv-validation';
import { toast } from 'sonner';

interface ManualField {
  id: string;
  name: string;
  label: string;
  type: string;
  description: string;
  required: boolean;
  options?: string[];
}

interface ManualFieldStepProps {
  inputType: string;
  fields: ManualField[];
  setFields: (fields: ManualField[]) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isEditMode?: boolean;
  onDeleteField?: (fieldId: string) => void;
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date Time' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'url', label: 'URL' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi Select' },
];

export default function ManualFieldStep({
  inputType,
  fields,
  setFields,
  onSubmit,
  isLoading,
  isEditMode = false,
  onDeleteField,
}: ManualFieldStepProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [optionsInputs, setOptionsInputs] = useState<Record<string, string>>(
    {}
  );

  const getAiPromptPlaceholder = (
    fieldLabel: string,
    fieldType?: string,
    options?: string[]
  ) => {
    const labelLower = fieldLabel.toLowerCase();
    let basePrompt = '';
    switch (inputType) {
      case 'text':
        basePrompt = `Extract ${labelLower} from the provided text input`;
        break;
      case 'audio':
        basePrompt = `Extract ${labelLower} from the audio recording transcription`;
        break;
      case 'image':
        basePrompt = `Extract ${labelLower} from the uploaded image`;
        break;
      default:
        basePrompt = `Extract ${labelLower} from the input`;
    }

    if (
      (fieldType === 'select' || fieldType === 'multiselect') &&
      options &&
      options.length > 0
    ) {
      basePrompt += `. Only extract values that match these options: ${options.join(', ')}`;
    }

    return basePrompt;
  };

  const addField = () => {
    const field: ManualField = {
      id: Date.now().toString(),
      name: 'new_field',
      label: 'New Field',
      type: 'text',
      description: '',
      required: false,
      options: [],
    };

    setFields([...fields, field]);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<ManualField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const downloadCSV = () => {
    const headers = [
      'name',
      'label',
      'type',
      'required',
      'options',
      'description',
    ];
    const exampleRow = [
      'patient_name',
      'Patient Name',
      'text',
      'true',
      '',
      'Patient full name',
    ];
    const selectExampleRow = [
      'gender',
      'Gender',
      'select',
      'true',
      'Male,Female,Other',
      'Patient gender selection',
    ];

    const csvContent = [headers, exampleRow, selectExampleRow]
      .map((row) => row.map((field) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'field-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

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
      const newFields: ManualField[] = validation.data.map((row, index) => {
        const options = row.options
          ? row.options
              .split(',')
              .map((o: string) => o.trim())
              .filter((o: string) => o)
          : [];

        return {
          id: Date.now().toString() + index,
          name: row.name || `field_${index + 1}`,
          label: row.label || `Field ${index + 1}`,
          type: row.type || 'text',
          required: ['true', '1'].includes(row.required?.toLowerCase()),
          options,
          description: row.description || '',
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
          Manual Fields
        </h2>
        <p className="text-gray-600">
          Create custom fields for your {inputType} workflow
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={addField}
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
              setFields(newFields);
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
                    value={field.name}
                    onChange={(e) =>
                      updateField(field.id, { name: e.target.value })
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
                    value={field.type}
                    onChange={(e) =>
                      updateField(field.id, { type: e.target.value })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  >
                    {fieldTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField(field.id, { required: e.target.checked })
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

              {(field.type === 'select' || field.type === 'multiselect') && (
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
                      updateField(field.id, { options });
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
                  value={field.description}
                  onChange={(e) =>
                    updateField(field.id, { description: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  rows={3}
                  placeholder={getAiPromptPlaceholder(
                    field.label,
                    field.type,
                    field.options
                  )}
                />
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <p>
              No fields added yet. Click &ldquo;Add Field&rdquo; to get started.
            </p>
          </div>
        )}
      </div>

      {fields.length > 0 && (
        <div className="flex justify-end">
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isLoading
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Workflow'
                : 'Create Workflow'}
          </button>
        </div>
      )}
    </div>
  );
}
