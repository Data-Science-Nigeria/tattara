'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  collectorControllerSubmitDataMutation,
  fieldControllerGetWorkflowFieldsOptions,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { validateFieldValue } from '@/lib/field-validation';
import { useAuthStore } from '@/app/store/use-auth-store';

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
  hideButtons?: boolean;
}

export default function FormRenderer({
  workflowId,
  workflowType,
  inputData,
  onProcessingComplete,
  hideButtons = false,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [aiReviewData, setAiReviewData] = useState<AiReviewData | null>(null);
  const [aiProcessingLogId, setAiProcessingLogId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { auth } = useAuthStore();

  // Auto-process when component mounts with input data
  useEffect(() => {
    if (inputData && !aiReviewData && !isProcessing) {
      handleProcess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputData, aiReviewData, isProcessing]);

  const { data: fieldsData } = useQuery({
    ...fieldControllerGetWorkflowFieldsOptions({
      path: { workflowId },
    }),
  });

  const sortedFields = React.useMemo(() => {
    const fields = (fieldsData as { data?: FormField[] })?.data || [];
    return fields.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [fieldsData]);

  const aiProcessMutation = useMutation({
    mutationFn: async ({
      body,
      formData,
    }: {
      body?: Record<string, unknown>;
      formData?: FormData;
    }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/collector/process-ai`,
        {
          method: 'POST',
          body: formData || JSON.stringify(body),
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${auth?.token}`,
            ...(formData ? {} : { 'Content-Type': 'application/json' }),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  });

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
  });

  const handleInputChange = (fieldName: string, value: unknown) => {
    // Update form data first
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Then validate
    const field = sortedFields.find((f) => f.fieldName === fieldName);
    if (field) {
      const validation = validateFieldValue(
        value as string | boolean,
        field.fieldType,
        field.options
      );
      setFieldErrors((prev) => ({
        ...prev,
        [fieldName]: validation.isValid ? '' : validation.error || '',
      }));
    }
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      let aiResponse;

      if (workflowType === 'image') {
        // For images, convert base64 back to File and use FormData
        const base64Data = inputData as string;
        const response = await fetch(base64Data);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });

        const formData = new FormData();
        formData.append('workflowId', workflowId);
        formData.append('processingType', 'image');
        formData.append('files', file);

        aiResponse = await aiProcessMutation.mutateAsync({ formData });
      } else {
        // For text and audio, use JSON body
        const body: {
          workflowId: string;
          processingType: 'text' | 'audio';
          text?: string;
          audio?: string;
        } = {
          workflowId,
          processingType: workflowType as 'text' | 'audio',
        };

        if (workflowType === 'text') {
          body.text = inputData as string;
        } else if (workflowType === 'audio') {
          body.audio = inputData as string;
        }

        aiResponse = await aiProcessMutation.mutateAsync({ body });
      }

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

  const hasValidationErrors = () => {
    // Check for field validation errors
    const hasFieldErrors = Object.values(fieldErrors).some(
      (error) => error !== ''
    );

    // Check for empty fields (ALL fields must be completed)
    const hasEmptyFields = sortedFields.some((field) => {
      const value = formData[field.fieldName];
      return (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '')
      );
    });

    return hasFieldErrors || hasEmptyFields;
  };

  const handleSubmit = async () => {
    if (hasValidationErrors()) {
      toast.error('Please fix all validation errors before submitting.');
      return;
    }

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

      // Only redirect on successful submission
      setTimeout(() => {
        window.location.href = '/user/overview';
      }, 1000);
    } catch (error) {
      console.error('Submission error:', error);
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
            className={`w-full rounded-lg border bg-white px-3 py-2.5 transition-colors focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
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
            className={`w-full rounded-lg border bg-white px-3 py-2.5 transition-colors focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
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
            className={`w-full rounded-lg border bg-white px-3 py-2.5 transition-colors focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
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
            rows={4}
            className={`w-full resize-none rounded-lg border bg-white px-3 py-2.5 transition-colors focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
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
            className={`w-full rounded-lg border bg-white px-3 py-2.5 transition-colors focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-gray-300 hover:border-gray-400 focus:border-blue-500 focus:ring-blue-100'
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
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Yes</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (!aiReviewData) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="rounded-xl border border-gray-200 bg-white">
        {/* Header */}
        <div className="rounded-t-xl border-b border-gray-200 bg-gradient-to-r from-blue-50 to-green-50 px-8 py-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Review & Confirm Data
          </h2>
          <p className="mt-2 text-gray-600">
            AI has extracted the following information. Please review and make
            any necessary corrections:
          </p>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {sortedFields.map((field) => (
              <div
                key={field.id}
                className={`space-y-2 ${
                  field.fieldType === 'textarea' ? 'md:col-span-2' : ''
                }`}
              >
                <label className="block text-sm font-medium text-gray-700">
                  {field.label}
                  {field.isRequired && (
                    <span className="ml-1 text-red-500">*</span>
                  )}
                </label>
                <div className="relative">
                  {renderField(field)}
                  {aiReviewData?.extracted?.[field.fieldName] !== undefined &&
                    aiReviewData?.extracted?.[field.fieldName] !== null &&
                    formData[field.fieldName] !== undefined &&
                    formData[field.fieldName] !== null &&
                    formData[field.fieldName] !== '' && (
                      <div className="absolute -top-2 right-2">
                        <span className="inline-flex items-center rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-800">
                          AI Extracted
                        </span>
                      </div>
                    )}
                </div>
                {fieldErrors[field.fieldName] && (
                  <p className="flex items-center gap-1 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    {fieldErrors[field.fieldName]}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Missing Fields Alert */}
          {aiReviewData?.missing_required &&
            aiReviewData.missing_required.length > 0 && (
              <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Missing Required Fields
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Please fill in: {aiReviewData.missing_required.join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="rounded-b-xl border-t border-gray-200 bg-gray-50 px-8 py-6">
          <div className="flex items-center justify-end">
            {!hideButtons && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || hasValidationErrors()}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-8 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Data to DHIS2'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
