'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';

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
}: ManualFieldStepProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [optionsInputs, setOptionsInputs] = useState<Record<string, string>>(
    {}
  );

  const getAiPromptPlaceholder = () => {
    const labelLower = 'field';
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

      <div className="flex gap-3">
        <button
          onClick={addField}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </button>
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
                  {!isEditMode && (
                    <button
                      onClick={() => removeField(field.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
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
                  placeholder={getAiPromptPlaceholder()}
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
