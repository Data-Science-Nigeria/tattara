'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  collectorControllerProcessAiMutation,
  collectorControllerSubmitDataMutation,
} from '@/client/@tanstack/react-query.gen';

interface TextRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'text';
    prompt?: string;
    maxLength?: number;
    aiProcessing?: boolean;
  };
}

interface ProcessedData {
  [key: string]: unknown;
}

export default function TextRenderer({ workflow }: TextRendererProps) {
  const [textInput, setTextInput] = useState('');
  const [processedData, setProcessedData] = useState<ProcessedData | null>(
    null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const processAiMutation = useMutation({
    ...collectorControllerProcessAiMutation(),
  });

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
  });

  const handleProcess = async () => {
    if (!textInput.trim()) return;

    setIsProcessing(true);
    try {
      const result = await processAiMutation.mutateAsync({
        body: {
          workflowId: workflow.id,
          processingType: 'text',
          text: textInput,
        },
      });
      setProcessedData(result);
    } catch (error) {
      console.error('Failed to process text:', error);
      alert('Failed to process text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        body: {
          workflowId: workflow.id,
          data: {
            text: textInput,
          },
          metadata: {
            type: 'text',
            length: textInput.length,
          },
        },
      });

      alert('Text submitted successfully!');
      window.location.href = '/user/overview';
    } catch (error) {
      console.error('Failed to submit text:', error);
      alert('Failed to submit text. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="space-y-6">
        {workflow.prompt && (
          <div className="rounded-lg bg-blue-50 p-4">
            <h3 className="mb-2 font-medium text-blue-900">Instructions:</h3>
            <p className="text-blue-800">{workflow.prompt}</p>
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Enter your text:
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            maxLength={workflow.maxLength}
            rows={6}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Type your text here..."
          />
          {workflow.maxLength && (
            <p className="mt-1 text-sm text-gray-500">
              {textInput.length}/{workflow.maxLength} characters
            </p>
          )}
        </div>

        {workflow.aiProcessing && !processedData && (
          <div className="flex justify-center">
            <button
              onClick={handleProcess}
              disabled={!textInput.trim() || isProcessing}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Process with AI'}
            </button>
          </div>
        )}

        {processedData && (
          <div className="rounded-lg bg-green-50 p-4">
            <h3 className="mb-2 font-medium text-green-900">
              Processed Result:
            </h3>
            <pre className="whitespace-pre-wrap text-green-800">
              {JSON.stringify(processedData, null, 2)}
            </pre>
          </div>
        )}

        <div className="flex justify-end gap-4">
          <button
            onClick={() => (window.location.href = '/user/overview')}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              !textInput.trim() ||
              isSubmitting ||
              (workflow.aiProcessing && !processedData)
            }
            className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}
