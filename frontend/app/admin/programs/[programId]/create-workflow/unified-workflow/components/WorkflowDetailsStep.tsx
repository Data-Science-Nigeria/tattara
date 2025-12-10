'use client';

import { useState } from 'react';
import { Edit, Mic, Image } from 'lucide-react';
import ExternalConnectionModal from './ExternalConnectionModal';

interface WorkflowData {
  name: string;
  description: string;
  inputType: 'text' | 'audio' | 'image';
  supportedLanguages: string[];
}

interface WorkflowDetailsStepProps {
  workflowData: WorkflowData;
  setWorkflowData: (data: WorkflowData) => void;
  isExternalMode: boolean | null;
  onExternalModeChange: (
    useExternal: boolean,
    connectionId?: string,
    connectionType?: string
  ) => void;
  isEditMode?: boolean;
}

export default function WorkflowDetailsStep({
  workflowData,
  setWorkflowData,
  isExternalMode,
  onExternalModeChange,
  isEditMode = false,
}: WorkflowDetailsStepProps) {
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [externalStatus, setExternalStatus] = useState<
    'none' | 'selected' | 'not-selected'
  >(
    isExternalMode === null
      ? 'none'
      : isExternalMode
        ? 'selected'
        : 'not-selected'
  );

  const inputTypes = [
    {
      id: 'text' as const,
      name: 'Text',
      icon: Edit,
      description: 'AI-powered text input and processing',
    },
    {
      id: 'audio' as const,
      name: 'Audio',
      icon: Mic,
      description: 'Voice recording with transcription',
    },
    {
      id: 'image' as const,
      name: 'Image',
      icon: Image,
      description: 'Image capture with OCR processing',
    },
  ];

  const validateTextContent = (text: string): boolean => {
    const textChars = text.replace(/[^a-zA-Z]/g, '').length;
    const numberChars = text.replace(/[^0-9]/g, '').length;
    return textChars > numberChars;
  };

  const updateWorkflowData = (updates: Partial<WorkflowData>) => {
    setWorkflowData({ ...workflowData, ...updates });
  };

  const handleExternalConfirm = (
    useExternal: boolean,
    connectionId?: string,
    connectionType?: string
  ) => {
    onExternalModeChange(useExternal, connectionId, connectionType);
    setExternalStatus(useExternal ? 'selected' : 'not-selected');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Workflow Details
        </h2>
        <p className="text-gray-600">
          Enter the basic information for your workflow
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Workflow Name <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={workflowData.name}
          onChange={(e) => updateWorkflowData({ name: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
          placeholder="Enter workflow name"
          required
        />
        {workflowData.name.trim() && workflowData.name.trim().length < 8 && (
          <p className="mt-1 text-sm text-red-600">
            Name must be at least 8 characters
          </p>
        )}
        {workflowData.name.trim() &&
          workflowData.name.trim().length >= 8 &&
          !validateTextContent(workflowData.name) && (
            <p className="mt-1 text-sm text-red-600">
              Name cannot contain only numbers
            </p>
          )}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Description <span className="text-red-600">*</span>
        </label>
        <textarea
          value={workflowData.description}
          onChange={(e) => updateWorkflowData({ description: e.target.value })}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
          placeholder="Enter workflow description"
          required
        />
        {workflowData.description.trim() &&
          workflowData.description.trim().length < 15 && (
            <p className="mt-1 text-sm text-red-600">
              Description must be at least 15 characters
            </p>
          )}
        {workflowData.description.trim() &&
          workflowData.description.trim().length >= 15 &&
          !validateTextContent(workflowData.description) && (
            <p className="mt-1 text-sm text-red-600">
              Description cannot contain only numbers
            </p>
          )}
      </div>

      {/* Input Type Selection */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">
          Input Type <span className="text-red-600">*</span>
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          Choose how users will input data for this workflow
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {inputTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => updateWorkflowData({ inputType: type.id })}
              className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-green-600 hover:shadow-md ${
                workflowData.inputType === type.id
                  ? 'border-green-600 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <type.icon className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="mb-2 text-sm font-medium text-gray-900">
                {type.name}
              </h4>
              <p className="text-xs leading-relaxed text-gray-600">
                {type.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Supported Language <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { name: 'English' },
            { name: 'Yoruba' },
            { name: 'Igbo' },
            { name: 'Hausa' },
          ].map((lang) => (
            <label key={lang.name} className="flex items-center space-x-2">
              <input
                type="radio"
                name="language"
                checked={workflowData.supportedLanguages[0] === lang.name}
                onChange={() => {
                  updateWorkflowData({
                    supportedLanguages: [lang.name],
                  });
                }}
                className="border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm text-gray-700">{lang.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* External Integration Selection */}
      {workflowData.inputType && (
        <div className="border-t pt-6">
          <h3 className="mb-4 text-sm font-medium text-gray-700">
            External Integration <span className="text-red-600">*</span>
          </h3>
          <div className="space-y-4">
            <button
              onClick={() => setShowExternalModal(true)}
              disabled={isEditMode}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {externalStatus === 'none'
                ? 'Select External Integration'
                : isEditMode
                  ? 'Integration Mode (Cannot Change)'
                  : 'Change Integration Selection'}
            </button>

            {externalStatus === 'selected' && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-sm text-green-700">
                  External integration selected
                </p>
              </div>
            )}

            {externalStatus === 'not-selected' && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-sm text-gray-600">
                  No external integration selected
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <ExternalConnectionModal
        isOpen={showExternalModal}
        onClose={() => setShowExternalModal(false)}
        onConfirm={handleExternalConfirm}
      />
    </div>
  );
}
