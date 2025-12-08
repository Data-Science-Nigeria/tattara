'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  collectorControllerSubmitDataMutation,
  workflowControllerFindWorkflowByIdOptions,
} from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { validateFieldValue } from '@/lib/field-validation';
import { useAuthStore } from '@/app/store/use-auth-store';
import { getLanguageForBackend } from '@/lib/language-utils';

interface AiReviewData {
  form_id: string;
  total_rows: number;
  rows: Array<{
    row_index: number;
    extracted: Record<string, unknown>;
    missing_required: string[];
  }>;
  confidence?: Record<string, number>;
  meta?: Record<string, unknown>;
  metrics?: Record<string, unknown>;
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
  language?: string;
}

export default function FormRenderer({
  workflowId,
  workflowType,
  inputData,
  onProcessingComplete,
  hideButtons = false,
  language,
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [bulkFormData, setBulkFormData] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [aiReviewData, setAiReviewData] = useState<AiReviewData | null>(null);
  const [aiProcessingLogId, setAiProcessingLogId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkMode, setIsBulkMode] = useState(false);
  const hasProcessedRef = React.useRef(false);
  const { auth } = useAuthStore();

  // Auto-process when component mounts with input data
  useEffect(() => {
    if (
      inputData &&
      !aiReviewData &&
      !isProcessing &&
      !hasProcessedRef.current
    ) {
      hasProcessedRef.current = true;
      handleProcess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputData, aiReviewData]);

  const { data: workflowData } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId },
    }),
  });

  const sortedFields = React.useMemo(() => {
    const fields =
      (workflowData as { data?: { workflowFields?: FormField[] } })?.data
        ?.workflowFields || [];
    return fields.sort((a, b) => a.displayOrder - b.displayOrder);
  }, [workflowData]);

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

    // Update bulk data if in bulk mode
    if (isBulkMode) {
      const updatedBulkData = [...bulkFormData];
      updatedBulkData[currentEntryIndex] = { ...formData, [fieldName]: value };
      setBulkFormData(updatedBulkData);
    }

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

  const normalizeFormData = (
    data: Record<string, unknown>,
    fields: FormField[]
  ) => {
    const normalized = { ...data };

    fields.forEach((field) => {
      if (
        (field.fieldType === 'multiselect' || field.fieldType === 'select') &&
        field.options
      ) {
        const value = normalized[field.fieldName];

        if (Array.isArray(value)) {
          const optionsLower = field.options.map((o) => o.toLowerCase());
          normalized[field.fieldName] = value
            .map((v) => {
              const idx = optionsLower.indexOf(String(v).toLowerCase());
              return idx >= 0 ? field.options![idx] : null;
            })
            .filter((v) => v !== null);
        } else if (value) {
          const optionsLower = field.options.map((o) => o.toLowerCase());
          const idx = optionsLower.indexOf(String(value).toLowerCase());
          normalized[field.fieldName] = idx >= 0 ? field.options[idx] : '';
        }
      }
    });

    return normalized;
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    try {
      let aiResponse;

      if (workflowType === 'image') {
        const formData = new FormData();
        formData.append('workflowId', workflowId);
        formData.append('processingType', 'image');
        if (language)
          formData.append('language', getLanguageForBackend(language));

        const base64Array =
          typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
        const dataArray = Array.isArray(base64Array)
          ? base64Array
          : [base64Array];

        for (let i = 0; i < dataArray.length; i++) {
          const response = await fetch(dataArray[i]);
          const blob = await response.blob();
          const file = new File([blob], `image-${i}.jpg`, {
            type: 'image/jpeg',
          });
          formData.append('files', file);
        }

        aiResponse = await aiProcessMutation.mutateAsync({ formData });
      } else if (workflowType === 'audio') {
        const formData = new FormData();
        formData.append('workflowId', workflowId);
        formData.append('processingType', 'audio');
        if (language)
          formData.append('language', getLanguageForBackend(language));

        const audioArray =
          typeof inputData === 'string' ? JSON.parse(inputData) : inputData;
        const dataArray = Array.isArray(audioArray) ? audioArray : [audioArray];

        for (let i = 0; i < dataArray.length; i++) {
          const response = await fetch(dataArray[i]);
          const blob = await response.blob();
          const file = new File([blob], `audio-${i}.wav`, {
            type: 'audio/wav',
          });
          formData.append('files', file);
        }

        aiResponse = await aiProcessMutation.mutateAsync({ formData });
      } else {
        const body = {
          workflowId,
          processingType: 'text' as const,
          text: inputData as string,
          ...(language && { language: getLanguageForBackend(language) }),
        };

        aiResponse = await aiProcessMutation.mutateAsync({ body });
      }

      const responseData = aiResponse as {
        data?: { aiData?: AiReviewData; aiProcessingLogId?: string };
      };

      const aiData = responseData?.data?.aiData;
      setAiReviewData(aiData || null);
      setAiProcessingLogId(responseData?.data?.aiProcessingLogId || '');

      if (aiData?.rows && aiData.rows.length > 0) {
        if (aiData.rows.length > 1) {
          const normalized = aiData.rows.map((row) =>
            normalizeFormData(row.extracted, sortedFields)
          );
          setBulkFormData(normalized);
          setFormData(normalized[0] || {});
          setIsBulkMode(true);
        } else {
          const normalized = normalizeFormData(
            aiData.rows[0].extracted,
            sortedFields
          );
          setFormData(normalized);
          setIsBulkMode(false);
        }
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

    // Check for empty REQUIRED fields only
    const hasEmptyRequiredFields = sortedFields.some((field) => {
      if (!field.isRequired) return false;

      const value = formData[field.fieldName];

      // For multiselect, check if array is empty
      if (field.fieldType === 'multiselect') {
        return !Array.isArray(value) || value.length === 0;
      }

      // For other fields, check if empty
      return (
        value === undefined ||
        value === null ||
        value === '' ||
        (typeof value === 'string' && value.trim() === '')
      );
    });

    return hasFieldErrors || hasEmptyRequiredFields;
  };

  const handleSubmit = async () => {
    if (hasValidationErrors()) {
      toast.error('Please fix all validation errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = isBulkMode
        ? {
            workflowId,
            dataEntries: bulkFormData,
            metadata: { type: workflowType },
            aiProcessingLogId,
          }
        : {
            workflowId,
            data: formData,
            metadata: { type: workflowType },
            aiProcessingLogId,
          };

      await submitMutation.mutateAsync({ body: submitData });

      toast.success('Data submitted successfully!');
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

  const handlePrevEntry = () => {
    if (currentEntryIndex > 0) {
      bulkFormData[currentEntryIndex] = formData;
      setBulkFormData([...bulkFormData]);
      setCurrentEntryIndex(currentEntryIndex - 1);
      setFormData(bulkFormData[currentEntryIndex - 1]);
    }
  };

  const handleNextEntry = () => {
    if (currentEntryIndex < bulkFormData.length - 1) {
      bulkFormData[currentEntryIndex] = formData;
      setBulkFormData([...bulkFormData]);
      setCurrentEntryIndex(currentEntryIndex + 1);
      setFormData(bulkFormData[currentEntryIndex + 1]);
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
      case 'multiselect':
        const selectedValues = Array.isArray(formData[field.fieldName])
          ? (formData[field.fieldName] as string[])
          : [];
        return (
          <div
            className={`w-full rounded-lg border bg-white p-2 transition-colors focus-within:ring-2 focus-within:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-100'
                : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-100 hover:border-gray-400'
            }`}
          >
            {field.options?.map((option) => (
              <label key={option} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option]
                      : selectedValues.filter((v) => v !== option);
                    handleInputChange(field.fieldName, newValues);
                  }}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      case 'boolean':
        const boolValue = formData[field.fieldName] as boolean | undefined;
        return (
          <div className="flex gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={field.fieldName}
                checked={boolValue === true}
                onChange={() => handleInputChange(field.fieldName, true)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name={field.fieldName}
                checked={boolValue === false}
                onChange={() => handleInputChange(field.fieldName, false)}
                className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Review & Confirm Data{' '}
                {isBulkMode &&
                  `(${currentEntryIndex + 1}/${bulkFormData.length})`}
              </h2>
              <p className="mt-2 text-gray-600">
                The following information has been extracted. Please review and
                make any necessary corrections:
              </p>
            </div>
            {isBulkMode && bulkFormData.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={handlePrevEntry}
                  disabled={currentEntryIndex === 0}
                  className="rounded-lg bg-gray-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={handleNextEntry}
                  disabled={currentEntryIndex === bulkFormData.length - 1}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          <div className="grid gap-6 md:grid-cols-2">
            {sortedFields.map((field) => (
              <div
                key={field.id}
                className={`space-y-2 ${
                  ['textarea', 'select', 'multiselect', 'boolean'].includes(
                    field.fieldType
                  )
                    ? 'md:col-span-2'
                    : ''
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
                  {aiReviewData?.rows?.[isBulkMode ? currentEntryIndex : 0]
                    ?.extracted?.[field.fieldName] !== undefined &&
                    aiReviewData?.rows?.[isBulkMode ? currentEntryIndex : 0]
                      ?.extracted?.[field.fieldName] !== null &&
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
          {aiReviewData?.rows?.[isBulkMode ? currentEntryIndex : 0]
            ?.missing_required &&
            aiReviewData.rows[isBulkMode ? currentEntryIndex : 0]
              .missing_required.length > 0 && (
              <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-start">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Missing Required Fields
                    </h3>
                    <p className="mt-1 text-sm text-yellow-700">
                      Please fill in:{' '}
                      {aiReviewData.rows[
                        isBulkMode ? currentEntryIndex : 0
                      ].missing_required.join(', ')}
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
                ) : isBulkMode ? (
                  `Submit ${bulkFormData.length} Entries`
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
