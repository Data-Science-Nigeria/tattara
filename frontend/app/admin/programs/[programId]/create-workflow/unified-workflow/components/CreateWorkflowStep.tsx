'use client';

import { getIconForWorkflow } from '@/app/admin/components/getIconForWorkflow';

interface WorkflowData {
  name: string;
  description: string;
  inputType: 'text' | 'audio' | 'image';
  supportedLanguages: string[];
}

interface ExternalConfig {
  connectionId: string;
  type: string;
  programId: string;
  orgUnits: string[];
  language: string;
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
}

interface CreateWorkflowStepProps {
  workflowData: WorkflowData;
  externalConfig: ExternalConfig;
  aiFields: AIField[];
  onSubmit: () => void;
  isLoading: boolean;
  isEditMode?: boolean;
}

export default function CreateWorkflowStep({
  workflowData,
  externalConfig,
  aiFields,
  onSubmit,
  isLoading,
  isEditMode = false,
}: CreateWorkflowStepProps) {
  const IconComponent = getIconForWorkflow([workflowData.inputType]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          Review & Create Workflow
        </h2>
        <p className="text-gray-600">
          Review your workflow configuration before creating
        </p>
      </div>

      <div className="rounded-lg border border-green-200 bg-green-50 p-6">
        <h3 className="mb-4 text-lg font-medium text-green-900">
          {isEditMode
            ? 'Ready to Update Your Workflow!'
            : 'Ready to Create Your Workflow!'}
        </h3>
        <p className="text-green-700">
          Your workflow is configured and ready to be{' '}
          {isEditMode ? 'updated' : 'created'}. Review the details below and
          click {isEditMode ? "'Update Workflow'" : "'Create Workflow'"} to
          proceed.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Workflow Details */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            Workflow Details
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Name:</span>
              <p className="text-gray-900">{workflowData.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Description:
              </span>
              <p className="text-gray-900">
                {workflowData.description || 'No description'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Input Type:
              </span>
              <div className="flex items-center gap-2 text-gray-900">
                <IconComponent className="h-4 w-4" />
                <span>
                  {workflowData.inputType.charAt(0).toUpperCase() +
                    workflowData.inputType.slice(1)}
                </span>
              </div>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Languages:
              </span>
              <p className="text-gray-900">
                {workflowData.supportedLanguages
                  .map((lang) => {
                    const langNames: Record<string, string> = {
                      en: 'English',
                      yo: 'Yoruba',
                      ig: 'Igbo',
                      ha: 'Hausa',
                    };
                    return langNames[lang] || lang;
                  })
                  .join(', ')}
              </p>
            </div>
          </div>
        </div>

        {/* External Configuration */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="mb-4 text-lg font-medium text-gray-900">
            External Configuration
          </h3>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Connection:
              </span>
              <p className="text-gray-900">
                {externalConfig.connectionId || 'Not configured'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Type:</span>
              <p className="text-gray-900 capitalize">
                {externalConfig.type || 'Not selected'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                {externalConfig.type === 'dataset' ? 'Dataset:' : 'Program:'}
              </span>
              <p className="text-gray-900">
                {externalConfig.programId || 'Not selected'}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Organization Units:
              </span>
              <p className="text-gray-900">
                {externalConfig.orgUnits.length} selected
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Language:
              </span>
              <p className="text-gray-900 capitalize">
                {externalConfig.language}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Fields Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="mb-4 text-lg font-medium text-gray-900">
          AI Fields ({aiFields.length})
        </h3>
        {aiFields.length > 0 ? (
          <div className="space-y-3">
            {aiFields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start justify-between rounded-lg border border-gray-100 p-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {field.label}
                    </span>
                    {field.isRequired && (
                      <span className="rounded bg-red-100 px-2 py-1 text-xs text-red-800">
                        Required
                      </span>
                    )}
                    <span className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {field.fieldType}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {field.fieldName}
                  </p>
                  <p className="mt-1 text-sm text-gray-600">{field.aiPrompt}</p>
                  {field.externalDataElement && (
                    <p className="mt-1 text-xs text-blue-600">
                      External: {field.externalDataElement}
                    </p>
                  )}
                </div>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No fields configured</p>
        )}
      </div>

      {/* Create Button */}
      <div className="flex justify-end">
        <button
          onClick={onSubmit}
          disabled={isLoading || aiFields.length === 0}
          className="rounded-lg bg-green-600 px-8 py-3 text-lg font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading
            ? isEditMode
              ? 'Updating Workflow...'
              : 'Creating Workflow...'
            : isEditMode
              ? 'Update Workflow'
              : 'Create Workflow'}
        </button>
      </div>
    </div>
  );
}
