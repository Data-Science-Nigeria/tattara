'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  collectorControllerSubmitDataMutation,
  fieldControllerGetWorkflowFieldsOptions,
  collectorControllerProcessAiMutation,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { validateFieldValue } from '@/lib/field-validation';

interface AiReviewData {
  form_id: string;
  extracted: Record<string, unknown>;
  missing_required: string[];
}

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
  options?: string[];
  displayOrder: number;
}

interface FormRendererProps {
  workflowId: string;
  workflowType: 'text' | 'audio' | 'image';
  inputData: unknown;
  onProcessingComplete?: () => void;
}

export default function FormRenderer({
  workflowId,
  workflowType,
  inputData,
  onProcessingComplete,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [aiReviewData, setAiReviewData] = useState<AiReviewData | null>(null);
  const [aiProcessingLogId, setAiProcessingLogId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fieldsData } = useQuery({
    ...fieldControllerGetWorkflowFieldsOptions({
      path: { workflowId },
    }),
  });

  const aiProcessMutation = useMutation({
    ...collectorControllerProcessAiMutation(),
  });

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
  });

  const fields = (fieldsData as { data?: FormField[] })?.data || [];
  const sortedFields = fields.sort((a, b) => a.displayOrder - b.displayOrder);

  const handleInputChange = (fieldName: string, value: unknown) => {
    const field = sortedFields.find((f) => f.fieldName === fieldName);
    if (field) {
      const validation = validateFieldValue(
        value as string | boolean,
        field.fieldType
      );
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: validation.isValid ? '' : validation.error || '',
      }));
    }
    setFormData((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      const body: {
        workflowId: string;
        processingType: 'text' | 'audio' | 'image';
        text?: string;
        audio?: string;
        image?: string;
      } = {
        workflowId,
        processingType: workflowType,
      };

      if (workflowType === 'text') {
        body.text = inputData as string;
      } else if (workflowType === 'audio') {
        body.audio = inputData as string;
      } else if (workflowType === 'image') {
        body.image = inputData as string;
      }

      const aiResponse = await aiProcessMutation.mutateAsync({ body });

      const responseData = aiResponse as {
        data?: { aiData?: AiReviewData; aiProcessingLogId?: string };
      };

      const aiData = responseData?.data?.aiData;
      setAiReviewData(aiData || null);
      setAiProcessingLogId(responseData?.data?.aiProcessingLogId || '');

      if (aiData?.extracted) {
        setFormData(aiData.extracted);
      }

      onProcessingComplete?.();
    } catch {
      toast.error(`Failed to process ${workflowType}. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        body: {
          workflowId,
          data: formData,
          metadata: {
            type: workflowType,
          },
          aiProcessingLogId,
        },
      });

      toast.success('Data submitted successfully!');
      window.location.href = '/user/overview';
    } catch {
      toast.error('Failed to submit data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.fieldType) {
      case 'text':
        return (
          <input
            type="text"
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded border-2 bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                : 'border-gray-400 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={
              typeof formData[field.fieldName] === 'number' ||
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string | number)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded border-2 bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                : 'border-gray-400 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded border-2 bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                : 'border-gray-400 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            rows={3}
            className={`w-full rounded border-2 bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                : 'border-gray-400 focus:border-blue-500 focus:ring-blue-200'
            }`}
          />
        );
      case 'select':
        return (
          <select
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded border-2 bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-600 focus:ring-red-200'
                : 'border-gray-400 focus:border-blue-500 focus:ring-blue-200'
            }`}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={
                typeof formData[field.fieldName] === 'boolean'
                  ? (formData[field.fieldName] as boolean)
                  : false
              }
              onChange={(e) =>
                handleInputChange(field.fieldName, e.target.checked)
              }
              className="h-5 w-5 rounded border-2 border-gray-400 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Yes</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!aiReviewData) {
    return (
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => (window.location.href = '/user/overview')}
          className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleProcess}
          disabled={isProcessing}
          className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Process with AI'}
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form className="rounded-lg border-2 border-gray-400 bg-white p-8 shadow-lg">
        <div className="mb-6 border-b-2 border-gray-300 pb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            Review Extracted Data
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            AI has extracted the following information. Please review and edit
            as needed:
          </p>
        </div>

        <div className="space-y-6">
          {sortedFields.map((field) => (
            <div
              key={field.id}
              className="rounded border border-gray-300 bg-gray-50 p-4"
            >
              <label className="mb-3 block border-b border-gray-400 pb-2 text-sm font-semibold text-gray-800">
                {field.label}
                {field.isRequired && (
                  <span className="ml-1 text-red-600">*</span>
                )}
              </label>
              <div className="mt-2">{renderField(field)}</div>
              {fieldErrors[field.fieldName] && (
                <p className="mt-2 border-l-4 border-red-500 pl-2 text-sm font-medium text-red-600">
                  {fieldErrors[field.fieldName]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 border-t-2 border-gray-300 pt-6">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => (window.location.href = '/user/overview')}
              className="rounded-lg border-2 border-gray-400 bg-gray-50 px-6 py-2 font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-lg border-2 border-green-700 bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Data'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
