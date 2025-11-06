'use client';

import { X, Play } from 'lucide-react';
import { useState } from 'react';
import { validateFieldValue } from '@/lib/field-validation';

interface Field {
  id: string;
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
  options?: string[];
}

interface WorkflowTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowType: 'form' | 'audio' | 'image' | 'text';
  fields: Field[];
}

export default function WorkflowTestModal({
  isOpen,
  onClose,
  workflowType,
  fields,
}: WorkflowTestModalProps) {
  const [testData, setTestData] = useState<Record<string, string | boolean>>(
    {}
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleInputChange = (fieldId: string, value: string | boolean) => {
    const field = fields.find((f) => f.id === fieldId);
    if (field) {
      const validation = validateFieldValue(value, field.fieldType);
      setFieldErrors((prev) => ({
        ...prev,
        [fieldId]: validation.isValid ? '' : validation.error || '',
      }));
    }
    setTestData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const renderTestInterface = () => {
    switch (workflowType) {
      case 'form':
        return (
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.isRequired && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>
                {field.fieldType === 'textarea' ? (
                  <textarea
                    value={(testData[field.id] as string) || ''}
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none ${
                      fieldErrors[field.id]
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-green-500'
                    }`}
                    rows={3}
                  />
                ) : field.fieldType === 'select' ? (
                  <select
                    value={(testData[field.id] as string) || ''}
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none ${
                      fieldErrors[field.id]
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-green-500'
                    }`}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.fieldType === 'multiselect' ? (
                  <select
                    multiple
                    value={((testData[field.id] as string) || '')
                      .split(',')
                      .filter(Boolean)}
                    onChange={(e) => {
                      const values = Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      );
                      handleInputChange(field.id, values.join(','));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none ${
                      fieldErrors[field.id]
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-green-500'
                    }`}
                    size={Math.min(field.options?.length || 3, 5)}
                  >
                    {field.options?.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : field.fieldType === 'boolean' ? (
                  <input
                    type="checkbox"
                    checked={(testData[field.id] as boolean) || false}
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.checked)
                    }
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                ) : (
                  <input
                    type={
                      field.fieldType === 'number'
                        ? 'number'
                        : field.fieldType === 'date'
                          ? 'date'
                          : field.fieldType === 'datetime'
                            ? 'datetime-local'
                            : field.fieldType === 'email'
                              ? 'email'
                              : field.fieldType === 'url'
                                ? 'url'
                                : field.fieldType === 'phone'
                                  ? 'tel'
                                  : 'text'
                    }
                    value={(testData[field.id] as string) || ''}
                    onChange={(e) =>
                      handleInputChange(field.id, e.target.value)
                    }
                    className={`w-full rounded-lg border px-3 py-2 focus:outline-none ${
                      fieldErrors[field.id]
                        ? 'border-red-500 focus:border-red-500'
                        : 'border-gray-300 focus:border-green-500'
                    }`}
                  />
                )}
                {fieldErrors[field.id] && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors[field.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        );

      case 'audio':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <div className="flex flex-col items-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Play className="h-8 w-8 text-red-600" />
                </div>
                <p className="mb-4 text-gray-600">
                  Click to start recording audio
                </p>
                <button className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">
                  Start Recording
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Test mode: Audio will be transcribed and processed by AI to
              extract field values
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-4">
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <p className="mb-4 text-gray-600">
                Upload an image or take a photo
              </p>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Choose Image
              </label>
            </div>
            <div className="text-sm text-gray-500">
              Test mode: Image will be processed by OCR to extract text and
              field values
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Enter text data
              </label>
              <textarea
                value={(testData.textInput as string) || ''}
                onChange={(e) => handleInputChange('textInput', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                rows={6}
                placeholder="Enter your text data here..."
              />
            </div>
            <div className="text-sm text-gray-500">
              Test mode: Text will be processed by AI to extract structured
              field values
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Test {workflowType.charAt(0).toUpperCase() + workflowType.slice(1)}{' '}
            Workflow
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">{renderTestInterface()}</div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">
            Test Process
          </button>
        </div>
      </div>
    </div>
  );
}
