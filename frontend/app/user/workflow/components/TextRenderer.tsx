'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerSubmitDataMutation } from '@/client/@tanstack/react-query.gen';
import AiReview from './AiReview';

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



export default function TextRenderer({ workflow }: TextRendererProps) {
  const [textInput, setTextInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReviewData, setAiReviewData] = useState<any>(null);
  const [aiProcessingLogId, setAiProcessingLogId] = useState<string>('');

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
  });

  const handleAiReviewComplete = (reviewData: any, processingLogId: string) => {
    setAiReviewData(reviewData);
    setAiProcessingLogId(processingLogId);
  };

  const handleReset = () => {
    setTextInput('');
    setAiReviewData(null);
    setAiProcessingLogId('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        body: {
          workflowId: workflow.id,
          data: { text: textInput },
          metadata: {
            type: 'text',
            length: textInput.length,
          },
          aiProcessingLogId: aiProcessingLogId,
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

        <AiReview 
          workflowId={workflow.id}
          formData={{ text: textInput }}
          fields={[]}
          aiReviewData={aiReviewData}
          onReviewComplete={handleAiReviewComplete}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
