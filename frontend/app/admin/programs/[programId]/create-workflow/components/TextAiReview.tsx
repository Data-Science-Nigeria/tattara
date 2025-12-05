import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/use-auth-store';
import AiResponseDisplay from '../field-mapping/components/AiResponseDisplay';

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
    success: boolean;
    data?: {
      aiData?: {
        form_id?: string;
        extracted?: Record<string, unknown>;
        confidence?: Record<string, number>;
        spans?: Record<string, unknown>;
        missing_required?: string[];
      };
      metrics?: {
        asr_seconds?: number;
        vision_seconds?: number;
        llm_seconds?: number;
        total_seconds?: number;
        tokens_in?: number;
        tokens_out?: number;
        cost_usd?: number;
        model?: string;
        provider?: string;
      };
      aiProcessingLogId?: string;
    };
    timestamp?: string;
    error?: string;
  } | null>(null);
  const { auth } = useAuthStore();

  const aiProcessMutation = useMutation({
    mutationFn: async ({ body }: { body: Record<string, unknown> }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/collector/process-ai`,
        {
          method: 'POST',
          body: JSON.stringify(body),
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth?.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
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

      setAiReviewData(aiResponse);
      toast.success('Text processed successfully!');
      onReviewComplete?.(aiResponse, aiResponse?.data?.aiProcessingLogId || '');
      onAiTestStatusChange?.(true);
    } catch {
      toast.error('Failed to process text');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <label className="text-md block font-medium text-gray-700">
          Write Text:
        </label>
        <textarea
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-green-500 focus:outline-none"
          rows={6}
          placeholder="Type your text here..."
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
        <AiResponseDisplay
          responseData={aiReviewData}
          onReset={() => {
            setAiReviewData(null);
            setTextInput('');
          }}
        />
      )}
    </div>
  );
}
