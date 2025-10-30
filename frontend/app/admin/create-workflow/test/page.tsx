'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';

interface WorkflowField {
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

interface Workflow {
  workflowFields?: WorkflowField[];
}

export default function TestWorkflow() {
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');

  const [testData, setTestData] = useState<Record<string, string | boolean>>(
    {}
  );
  const [fields, setFields] = useState<WorkflowField[]>([]);

  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: !!workflowId,
  });

  useEffect(() => {
    if (workflowData) {
      const workflow = (workflowData as { data?: Workflow })?.data;
      setFields(workflow?.workflowFields || []);
    }
  }, [workflowData]);

  const handleInputChange = (fieldId: string, value: string | boolean) => {
    setTestData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleTest = () => {
    alert('Test completed! Data would be processed and sent to DHIS2.');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <button
          onClick={() =>
            (window.location.href = `/admin/create-workflow/field-mapping?workflowId=${workflowId}`)
          }
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back to Field Mapping
        </button>
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          Test Workflow
        </h1>
        <p className="text-gray-600">
          Test your workflow by filling out the form below
        </p>
      </div>

      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
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
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                  rows={3}
                />
              ) : field.fieldType === 'select' ? (
                <select
                  value={(testData[field.id] as string) || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                >
                  <option value="">Select...</option>
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
                        : 'text'
                  }
                  value={(testData[field.id] as string) || ''}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-gray-200 pt-6">
          <button
            onClick={() =>
              (window.location.href = `/admin/create-workflow/field-mapping?workflowId=${workflowId}`)
            }
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Back
          </button>
          <button
            onClick={handleTest}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
          >
            Test Process
          </button>
        </div>
      </div>
    </div>
  );
}
