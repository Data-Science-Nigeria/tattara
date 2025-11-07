import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerProcessAiMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';

interface FormField {
  id: string;
  fieldName?: string;
  label?: string;
  fieldType: string;
  isRequired?: boolean;
}

interface AiReviewData {
  form_id: string;
  extracted: Record<string, unknown>;
  missing_required: string[];
}

interface AdminAiReviewProps {
  workflowId: string;
  formData: Record<string, unknown>;
  fields: FormField[];
  onReviewComplete?: (reviewData: unknown, logId: string) => void;
}

export default function AdminAiReview({
  workflowId,
  formData,
  fields,
  onReviewComplete,
}: AdminAiReviewProps) {
  const [isReviewing, setIsReviewing] = useState(false);
  const [aiReviewData, setAiReviewData] = useState<AiReviewData | null>(null);

  const aiProcessMutation = useMutation({
    ...collectorControllerProcessAiMutation(),
  });

  const handleReview = async () => {
    setIsReviewing(true);

    try {
      const aiResponse = await aiProcessMutation.mutateAsync({
        body: {
          workflowId: workflowId,
          processingType: 'text',
          text: JSON.stringify(formData),
        },
      });

      const responseData = aiResponse as {
        data?: { aiData?: AiReviewData; aiProcessingLogId?: string };
      };

      const reviewData = responseData?.data?.aiData;
      setAiReviewData(reviewData || null);

      if (onReviewComplete) {
        onReviewComplete(
          reviewData,
          responseData?.data?.aiProcessingLogId || ''
        );
      }
    } catch (error) {
      console.error('AI processing failed:', error);
      toast.error('Failed to process review. Please try again.');
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="mt-6">
      {!aiReviewData ? (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleReview}
            disabled={isReviewing}
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isReviewing ? 'Processing...' : 'Test AI Processing'}
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold text-gray-900">
            AI Processing Results
          </h3>
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Form ID:</strong> {aiReviewData.form_id}
            </p>
            <div className="text-sm text-gray-700">
              <strong>Extracted Data:</strong>
              <div className="mt-2 space-y-1">
                {Object.entries(aiReviewData.extracted || {}).map(
                  ([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="font-medium">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  )
                )}
              </div>
            </div>
            {aiReviewData.missing_required?.length > 0 && (
              <div className="text-sm text-red-600">
                <strong>Missing Required Fields:</strong>
                <ul className="mt-1 list-inside list-disc">
                  {aiReviewData.missing_required.map(
                    (field: string, index: number) => (
                      <li key={index}>{field}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setAiReviewData(null)}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
            >
              Test Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
