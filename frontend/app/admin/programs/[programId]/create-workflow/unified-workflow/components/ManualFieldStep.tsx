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
}: ManualFieldStepProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newField, setNewField] = useState<Omit<ManualField, 'id'>>({
    name: '',
    label: '',
    type: 'text',
    description: '',
    required: false,
    options: [],
  });
  const [optionInput, setOptionInput] = useState('');

  const getAiPromptPlaceholder = () => {
    const labelLower = newField.label.toLowerCase() || 'field';
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
      (newField.type === 'select' || newField.type === 'multiselect') &&
      newField.options &&
      newField.options.length > 0
    ) {
      basePrompt += `. Only extract values that match these options: ${newField.options.join(', ')}`;
    }

    return basePrompt;
  };

  const addField = () => {
    if (!newField.name.trim() || !newField.label.trim()) return;
    if (
      (newField.type === 'select' || newField.type === 'multiselect') &&
      (!newField.options || newField.options.length === 0)
    )
      return;

    const field: ManualField = {
      ...newField,
      id: Date.now().toString(),
      name: newField.name.trim(),
      label: newField.label.trim(),
      description: newField.description.trim() || getAiPromptPlaceholder(),
    };

    setFields([...fields, field]);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      description: '',
      required: false,
      options: [],
    });
    setOptionInput('');
    setShowAddForm(false);
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const addOption = () => {
    if (optionInput.trim() && !newField.options?.includes(optionInput.trim())) {
      setNewField({
        ...newField,
        options: [...(newField.options || []), optionInput.trim()],
      });
      setOptionInput('');
    }
  };

  const removeOption = (index: number) => {
    setNewField({
      ...newField,
      options: newField.options?.filter((_, i) => i !== index) || [],
    });
  };

  const handleTypeChange = (type: string) => {
    setNewField({
      ...newField,
      type,
      options: type === 'select' || type === 'multiselect' ? [] : undefined,
    });
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

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {fields.length} field{fields.length !== 1 ? 's' : ''} configured
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Add Field
        </button>
      </div>

      {showAddForm && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6">
          <h3 className="mb-4 font-medium text-gray-900">Add New Field</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Field Name *
                </label>
                <input
                  type="text"
                  value={newField.name}
                  onChange={(e) =>
                    setNewField({ ...newField, name: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="e.g., patient_age"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Field Label *
                </label>
                <input
                  type="text"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField({ ...newField, label: e.target.value })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="Patient Age"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Field Type
              </label>
              <select
                value={newField.type}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
              >
                {fieldTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {(newField.type === 'select' ||
              newField.type === 'multiselect') && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Options *
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={optionInput}
                      onChange={(e) => setOptionInput(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === 'Enter' && (e.preventDefault(), addOption())
                      }
                      className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                      placeholder="Enter option"
                    />
                    <button
                      type="button"
                      onClick={addOption}
                      disabled={!optionInput.trim()}
                      className="rounded-lg bg-gray-600 px-3 py-2 text-white hover:bg-gray-700 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                  {newField.options && newField.options.length > 0 && (
                    <div className="space-y-1">
                      {newField.options.map((option, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between rounded bg-white px-3 py-2"
                        >
                          <span>{option}</span>
                          <button
                            onClick={() => removeOption(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                AI Extraction Prompt
              </label>
              <textarea
                value={newField.description}
                onChange={(e) =>
                  setNewField({ ...newField, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                placeholder={getAiPromptPlaceholder()}
              />
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={newField.required}
                  onChange={(e) =>
                    setNewField({ ...newField, required: e.target.checked })
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Required field</span>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowAddForm(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={addField}
                disabled={
                  !newField.name.trim() ||
                  !newField.label.trim() ||
                  ((newField.type === 'select' ||
                    newField.type === 'multiselect') &&
                    (!newField.options || newField.options.length === 0))
                }
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4"
          >
            <div className="cursor-grab text-gray-400 hover:text-gray-600">
              <GripVertical className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="font-medium text-gray-900">{field.label}</h4>
                  <p className="text-sm text-gray-500">Name: {field.name}</p>
                  {field.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {field.description}
                    </p>
                  )}
                  {field.options && field.options.length > 0 && (
                    <div className="mt-2">
                      <p className="mb-1 text-xs text-gray-500">Options:</p>
                      <div className="flex flex-wrap gap-1">
                        {field.options.map((option, idx) => (
                          <span
                            key={idx}
                            className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700"
                          >
                            {option}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="ml-3 flex items-center gap-2">
                  {field.required && (
                    <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                      Required
                    </span>
                  )}
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                    {field.type}
                  </span>
                  <button
                    onClick={() => removeField(field.id)}
                    className="rounded p-1 text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {fields.length === 0 && !showAddForm && (
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
            {isLoading ? 'Creating...' : 'Create Workflow'}
          </button>
        </div>
      )}
    </div>
  );
}
