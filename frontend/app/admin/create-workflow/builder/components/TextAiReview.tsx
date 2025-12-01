import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerProcessAiMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

interface TextAiReviewProps {
  workflowId: string;
  onReviewComplete?: (reviewData: unknown, logId: string) => void;
  onAiTestStatusChange?: (hasCompleted: boolean) => void;
}

export default function TextAiReview({
  workflowId,
  onReviewComplete,
  onAiTestStatusChange,
}: TextAiReviewProps) {
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiReviewData, setAiReviewData] = useState<{
    extracted?: Record<string, unknown>;
    missing_required?: string[];
  } | null>(null);

  const aiProcessMutation = useMutation({
    ...collectorControllerProcessAiMutation(),
  });

  const handleProcess = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    try {
      const aiResponse = await aiProcessMutation.mutateAsync({
        body: {
          workflowId,
          processingType: 'text',
          text: textInput,
        },
      });

      const responseData = aiResponse as {
        data?: {
          aiData?: {
            extracted?: Record<string, unknown>;
            missing_required?: string[];
          };
          aiProcessingLogId?: string;
        };
      };

      const reviewData = responseData?.data?.aiData;
      setAiReviewData(reviewData || null);

      if (reviewData) {
        toast.success('Text processed successfully!');
        onReviewComplete?.(
          reviewData,
          responseData?.data?.aiProcessingLogId || ''
        );
        onAiTestStatusChange?.(true);
      }
    } catch {
      toast.error('Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-blue-600">
          <FileText className="h-5 w-5" />
          <h3 className="font-medium">Text Input</h3>
        </div>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          rows={6}
          placeholder="Enter your text data here..."
        />
      </div>

      {textInput.trim() && !aiReviewData && (
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing Text...' : 'Process with AI'}
        </button>
      )}

      {aiReviewData && (
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">AI Processing Results</h3>
          <div>
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
          {(aiReviewData.missing_required?.length ?? 0) > 0 && (
            <div className="mt-4 text-sm text-red-600">
              <strong>Missing Required Fields:</strong>
              <ul className="mt-1 list-inside list-disc">
                {aiReviewData.missing_required?.map(
                  (field: string, index: number) => (
                    <li key={index}>{field}</li>
                  )
                )}
              </ul>
            </div>
          )}
          <button
            onClick={() => {
              setAiReviewData(null);
              setTextInput('');
            }}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
