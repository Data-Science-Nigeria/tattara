'use client';

import { useState } from 'react';
import { Trash2, GripVertical, Eye } from 'lucide-react';

interface AiFieldMapping {
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
  aiPrompt: string;
  dhis2DataElement?: string;
}

interface AiFieldMappingSectionProps {
  aiFieldMappings: AiFieldMapping[];
  setAiFieldMappings: (mappings: AiFieldMapping[]) => void;
  basicConfig: { language: string };
  setBasicConfig: (config: { language: string }) => void;
  onShowFieldPreview: () => void;
  workflowType: 'text' | 'audio' | 'image';
}

export default function AiFieldMappingSection({
  aiFieldMappings,
  setAiFieldMappings,
  basicConfig,
  setBasicConfig,
  onShowFieldPreview,
  workflowType,
}: AiFieldMappingSectionProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const updateAiFieldMapping = (
    id: string,
    updates: Partial<AiFieldMapping>
  ) => {
    setAiFieldMappings(
      aiFieldMappings.map((mapping) =>
        mapping.id === id ? { ...mapping, ...updates } : mapping
      )
    );
  };

  const getPromptPlaceholder = () => {
    switch (workflowType) {
      case 'text':
        return 'e.g., Extract all symptoms mentioned in the text input';
      case 'audio':
        return "e.g., Extract the patient's age from the audio recording transcription";
      case 'image':
        return 'e.g., Extract the patient ID from the uploaded image using OCR';
      default:
        return 'Enter AI extraction prompt';
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-xs font-medium text-gray-700 sm:text-sm">
            Language
          </label>
          <select
            value={basicConfig.language}
            onChange={(e) =>
              setBasicConfig({ ...basicConfig, language: e.target.value })
            }
            className="w-full rounded-lg border border-gray-300 px-2 py-2 text-xs focus:border-green-500 focus:outline-none sm:px-3 sm:text-sm"
          >
            <option value="en">English</option>
            <option value="yo">Yoruba</option>
            <option value="ig">Igbo</option>
            <option value="ha">Hausa</option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <h3 className="text-sm font-medium text-gray-900 sm:text-lg">
            AI Field Extraction
          </h3>
          <div className="flex gap-2">
            {aiFieldMappings.length > 0 && (
              <button
                onClick={() => setAiFieldMappings([])}
                className="flex items-center justify-center gap-2 rounded-lg border border-red-600 px-3 py-2 text-xs text-red-600 hover:bg-red-50 sm:px-4 sm:text-sm"
              >
                <Trash2 size={14} className="sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Delete All</span>
                <span className="sm:hidden">Delete</span>
              </button>
            )}
            <button
              onClick={onShowFieldPreview}
              className="flex items-center justify-center gap-2 rounded-lg border border-green-600 px-3 py-2 text-xs text-green-600 hover:bg-green-50 sm:px-4 sm:text-sm"
            >
              <Eye size={14} className="sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Browse DHIS2 Fields</span>
              <span className="sm:hidden">Browse Fields</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {aiFieldMappings.map((mapping, index) => (
            <div
              key={mapping.id}
              className="relative rounded-lg border border-gray-200 p-4"
              draggable
              onDragStart={(e) => {
                setDraggedIndex(index);
                e.dataTransfer.effectAllowed = 'move';
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex === null || draggedIndex === index) return;
                const newMappings = [...aiFieldMappings];
                const draggedMapping = newMappings[draggedIndex];
                newMappings.splice(draggedIndex, 1);
                newMappings.splice(index, 0, draggedMapping);
                const updatedMappings = newMappings.map((m, i) => ({
                  ...m,
                  displayOrder: i + 1,
                }));
                setAiFieldMappings(updatedMappings);
                setDraggedIndex(null);
              }}
            >
              <div className="absolute top-4 left-2 cursor-move text-gray-400 hover:text-gray-600">
                <GripVertical size={16} />
              </div>
              <div className="ml-6 grid grid-cols-1 gap-4 md:grid-cols-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={mapping.fieldName}
                    onChange={(e) =>
                      updateAiFieldMapping(mapping.id, {
                        fieldName: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="e.g., patient_age"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Label
                  </label>
                  <input
                    type="text"
                    value={mapping.label}
                    onChange={(e) =>
                      updateAiFieldMapping(mapping.id, {
                        label: e.target.value,
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                    placeholder="Patient Age"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Field Type
                  </label>
                  <input
                    type="text"
                    value={mapping.fieldType}
                    readOnly
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-600"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={mapping.isRequired}
                      readOnly
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700">Required</span>
                  </label>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  AI Extraction Prompt
                </label>
                <textarea
                  value={mapping.aiPrompt}
                  onChange={(e) =>
                    updateAiFieldMapping(mapping.id, {
                      aiPrompt: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  rows={3}
                  placeholder={getPromptPlaceholder()}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
