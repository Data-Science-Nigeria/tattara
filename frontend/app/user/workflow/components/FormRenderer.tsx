'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fieldControllerGetWorkflowFieldsOptions } from '@/client/@tanstack/react-query.gen';
import { collectorControllerSubmitDataMutation } from '@/client/@tanstack/react-query.gen';
import { validateFieldValue } from '@/lib/field-validation';
import AiReview from './AiReview';

interface FormField {
  id: string;
  fieldName: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'email' | 'phone' | 'url' | 'textarea';
  isRequired: boolean;
  options?: string[];
  displayOrder: number;
}

interface FormRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'form';
  };
}

interface FieldsResponse {
  success: boolean;
  data: FormField[];
  timestamp: string;
}

type FormValue = string | number | boolean;

export default function FormRenderer({ workflow }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReviewData, setAiReviewData] = useState<any>(null);
  const [aiProcessingLogId, setAiProcessingLogId] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: fieldsData, isLoading } = useQuery({
    ...fieldControllerGetWorkflowFieldsOptions({
      path: { workflowId: workflow.id },
    }),
  });

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
  });

  const fields = (fieldsData as unknown as FieldsResponse)?.data || [];
  
  // Sort fields by display order
  const sortedFields = fields.sort((a, b) => a.displayOrder - b.displayOrder);

  const handleInputChange = (fieldName: string, value: FormValue) => {
    const field = sortedFields.find(f => f.fieldName === fieldName);
    if (field) {
      const validation = validateFieldValue(value as string | boolean, field.fieldType);
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: validation.isValid ? '' : validation.error || ''
      }));
    }
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleAiReviewComplete = (reviewData: any, processingLogId: string) => {
    setAiReviewData(reviewData);
    setAiProcessingLogId(processingLogId);
  };

  const handleReset = () => {
    setFormData({});
    setAiReviewData(null);
    setAiProcessingLogId('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      await submitMutation.mutateAsync({
        body: {
          workflowId: workflow.id,
          data: formData,
          metadata: {
            type: 'form',
            submittedAt: new Date().toISOString(),
          },
          aiProcessingLogId: aiProcessingLogId,
        },
      });

      alert('Form submitted successfully!');
      window.location.href = '/user/overview';
    } catch (error) {
      alert('Failed to submit form. Please try again.');
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
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
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
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
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
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            }`}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            }`}
          />
        );
      case 'phone':
        return (
          <input
            type="tel"
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            }`}
          />
        );
      case 'url':
        return (
          <input
            type="url"
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            }`}
          />
        );
      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
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
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
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
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
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
        return (
          <select
            multiple
            value={
              typeof formData[field.fieldName] === 'string'
                ? (formData[field.fieldName] as string).split(',')
                : []
            }
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => option.value);
              handleInputChange(field.fieldName, values.join(','));
            }}
            className={`w-full rounded-lg border bg-white px-3 py-2 focus:ring-2 focus:outline-none ${
              fieldErrors[field.fieldName]
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
            }`}
            size={Math.min(field.options?.length || 3, 5)}
          >
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={
              typeof formData[field.fieldName] === 'boolean'
                ? (formData[field.fieldName] as boolean)
                : false
            }
            onChange={(e) => handleInputChange(field.fieldName, e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
      <div className="space-y-6">
        {sortedFields.map((field: FormField) => (
          <div key={field.id}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {field.label}
              {field.isRequired && <span className="ml-1 text-red-500">*</span>}
            </label>
            {renderField(field)}
            {fieldErrors[field.fieldName] && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors[field.fieldName]}
              </p>
            )}
          </div>
        ))}

        <AiReview 
          workflowId={workflow.id}
          formData={formData}
          fields={sortedFields as any}
          aiReviewData={aiReviewData}
          onReviewComplete={handleAiReviewComplete}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}