'use client';

import { Plus, Trash2, GripVertical, Eye } from 'lucide-react';
import { useState } from 'react';
import FieldPreviewModal from './field-preview-modal';

interface FormField {
  id: string;
  fieldName: string;
  label: string;
  fieldType:
    | 'text'
    | 'number'
    | 'date'
    | 'datetime'
    | 'select'
    | 'multiselect'
    | 'boolean'
    | 'email'
    | 'phone'
    | 'url'
    | 'textarea';
  isRequired: boolean;
  displayOrder: number;
  options?: string[];
}

interface FormFieldsStepProps {
  fields: FormField[];
  setFields: (fields: FormField[]) => void;
  selectedConnection: string;
  selectedType: string;
  selectedProgram: string;
}

export default function FormFieldsStep({
  fields,
  setFields,
  selectedConnection,
  selectedType,
  selectedProgram,
}: FormFieldsStepProps) {
  const [showFieldPreview, setShowFieldPreview] = useState(false);
  const [optionsInputs, setOptionsInputs] = useState<Record<string, string>>(
    {}
  );

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      fieldName: '',
      label: '',
      fieldType: 'text',
      isRequired: false,
      displayOrder: fields.length + 1,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(
      fields.map((field) =>
        field.id === id ? { ...field, ...updates } : field
      )
    );
  };

  const removeField = (id: string) => {
    setFields(fields.filter((field) => field.id !== id));
  };

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFields = [...fields];
    const draggedField = newFields[draggedIndex];
    newFields.splice(draggedIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    // Update display order
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      displayOrder: index + 1,
    }));

    setFields(updatedFields);
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Form Fields</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFieldPreview(true)}
            className="flex items-center gap-2 rounded-lg border border-green-600 px-4 py-2 text-green-600 hover:bg-green-50"
          >
            <Eye size={16} />
            Browse DHIS2 Fields
          </button>
          <button
            onClick={addField}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            <Plus size={16} />
            Add Field
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="relative rounded-lg border border-gray-200 p-4"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <div className="absolute top-4 left-2 cursor-move text-gray-400 hover:text-gray-600">
              <GripVertical size={16} />
            </div>
            <div className="ml-6 grid grid-cols-1 gap-4 md:grid-cols-3">
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
                  placeholder="field_name"
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
                  placeholder="Field Label"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={field.fieldType}
                  onChange={(e) =>
                    updateField(field.id, {
                      fieldType: e.target.value as FormField['fieldType'],
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="datetime">Date Time</option>
                  <option value="select">Select</option>
                  <option value="multiselect">Multi Select</option>
                  <option value="boolean">Boolean</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="url">URL</option>
                  <option value="textarea">Textarea</option>
                </select>
              </div>
            </div>

            {(field.fieldType === 'select' ||
              field.fieldType === 'multiselect') && (
              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Options (comma-separated)
                </label>
                <input
                  type="text"
                  value={
                    optionsInputs[field.id] || field.options?.join(', ') || ''
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    setOptionsInputs((prev) => ({
                      ...prev,
                      [field.id]: value,
                    }));
                    updateField(field.id, {
                      options: value
                        .split(',')
                        .map((opt) => opt.trim())
                        .filter(Boolean),
                    });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  placeholder="Option 1, Option 2, Option 3"
                />
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={field.isRequired}
                  onChange={(e) =>
                    updateField(field.id, { isRequired: e.target.checked })
                  }
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-sm text-gray-700">Required field</span>
              </label>

              <button
                onClick={() => removeField(field.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {fields.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          No fields created yet. Click &quot;Add Field&quot; to get started.
        </div>
      )}

      <FieldPreviewModal
        isOpen={showFieldPreview}
        onClose={() => setShowFieldPreview(false)}
        preSelectedConnection={selectedConnection}
        preSelectedType={selectedType}
        preSelectedProgram={selectedProgram}
        onFieldsSelect={(selectedFields) => {
          const newFields = selectedFields.map((field, index) => ({
            id: Date.now().toString() + index,
            fieldName: field.name.toLowerCase().replace(/\s+/g, '_'),
            label: field.name,
            fieldType:
              field.valueType === 'NUMBER' || field.valueType === 'INTEGER'
                ? ('number' as const)
                : field.valueType === 'DATE'
                  ? ('date' as const)
                  : field.valueType === 'BOOLEAN' ||
                      field.valueType === 'TRUE_ONLY'
                    ? ('boolean' as const)
                    : ('text' as const),
            isRequired: field.mandatory || false,
            displayOrder: fields.length + index + 1,
          }));
          setFields([...fields, ...newFields]);
        }}
      />
    </div>
  );
}
