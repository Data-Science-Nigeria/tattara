import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerProcessAiMutation } from '@/client/@tanstack/react-query.gen';

interface FormField {
  id: string;
  fieldName: string;
  label: string;
  fieldType: 'text' | 'number' | 'date' | 'select' | 'checkbox';
  isRequired: boolean;
  options?: string[];
  displayOrder: number;
}

interface AiReviewProps {
  workflowId: string;
  formData: Record<string, any>;
  fields: FormField[];
  onReviewComplete: (reviewData: any, logId: string) => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  aiReviewData?: {
    form_id: string;
    extracted: Record<string, any>;
    missing_required: string[];
  } | null;
}

export default function AiReview({ workflowId, formData, fields, onReviewComplete, onSubmit, isSubmitting, aiReviewData }: AiReviewProps) {
  const [isReviewing, setIsReviewing] = useState(false);

  const validateRequiredFields = () => {
    const requiredFields = fields.filter(field => field.isRequired);
    const missingFields = requiredFields.filter(field => {
      const value = formData[field.fieldName];
      return !value || (typeof value === 'string' && value.trim() === '');
    });
    return missingFields;
  };

  const aiProcessMutation = useMutation({
    ...collectorControllerProcessAiMutation(),
  });

  const handleReview = async () => {
    const missingFields = validateRequiredFields();
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(field => field.label).join(', ');
      alert(`Please fill in the following required fields: ${fieldNames}`);
      return;
    }

    setIsReviewing(true);

    try {
      const aiResponse = await aiProcessMutation.mutateAsync({
        body: {
          workflowId: workflowId,
          processingType: 'text',
          text: JSON.stringify(formData),
        },
      });

      const responseData = (aiResponse as any)?.data;
      onReviewComplete(responseData?.aiData, responseData?.aiProcessingLogId);
    } catch (error) {
      alert('Failed to process review. Please try again.');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="mt-6">
      {!aiReviewData ? (
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
            onClick={handleReview}
            disabled={isReviewing}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isReviewing ? 'Reviewing...' : 'Review'}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-black">AI Review Results</h3>
          <div className="space-y-2">
            <p className="text-sm text-black">
              <strong>Form:</strong> {aiReviewData.form_id}
            </p>
            <div className="text-sm text-black">
              <strong>Extracted Data:</strong>
              <div className="mt-2 space-y-1">
                {Object.entries(aiReviewData.extracted || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            {aiReviewData.missing_required?.length > 0 && (
              <div className="text-sm text-red-600">
                <strong>Missing Required Fields:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {aiReviewData.missing_required.map((field: string, index: number) => (
                    <li key={index}>{field}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => (window.location.href = '/user/overview')}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            {onSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
                className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}