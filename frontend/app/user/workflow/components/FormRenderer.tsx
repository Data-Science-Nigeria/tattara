'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { fieldControllerGetWorkflowFieldsOptions } from '@/client/@tanstack/react-query.gen';
import { collectorControllerSubmitDataMutation } from '@/client/@tanstack/react-query.gen';

interface FormField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  required: boolean;
  options?: string[];
}

interface FormRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'form';
  };
}

interface FieldsResponse {
  data: FormField[];
}

type FormValue = string | number | boolean;

export default function FormRenderer({ workflow }: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, FormValue>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fieldsData, isLoading } = useQuery({
    ...fieldControllerGetWorkflowFieldsOptions({
      path: { workflowId: workflow.id },
    }),
  });

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
  });

  const fields = (fieldsData as unknown as FieldsResponse)?.data || [];

  const handleInputChange = (fieldId: string, value: FormValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
          aiProcessingLogId: 'temp-id',
        },
      });

      alert('Form submitted successfully!');
      window.location.href = '/user/overview';
    } catch (error) {
      console.error('Failed to submit form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={
              typeof formData[field.id] === 'string'
                ? (formData[field.id] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={
              typeof formData[field.id] === 'number' ||
              typeof formData[field.id] === 'string'
                ? (formData[field.id] as string | number)
                : ''
            }
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={
              typeof formData[field.id] === 'string'
                ? (formData[field.id] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
          />
        );
      case 'select':
        return (
          <select
            value={
              typeof formData[field.id] === 'string'
                ? (formData[field.id] as string)
                : ''
            }
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={
              typeof formData[field.id] === 'boolean'
                ? (formData[field.id] as boolean)
                : false
            }
            onChange={(e) => handleInputChange(field.id, e.target.checked)}
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map((field: FormField) => (
          <div key={field.id}>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {field.name}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => (window.location.href = '/user/overview')}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  );
}
