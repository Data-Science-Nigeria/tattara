import React from 'react';
import { X } from 'lucide-react';
import AudioAiReview from './AudioAiReview';
import ImageAiReview from './ImageAiReview';
import TextAiReview from './TextAiReview';

interface TestModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflowType: 'audio' | 'image' | 'text';
  workflowId: string;
  onReviewComplete?: (reviewData: unknown, logId: string) => void;
}

export default function TestModal({
  isOpen,
  onClose,
  workflowType,
  workflowId,
  onReviewComplete,
}: TestModalProps) {
  if (!isOpen) return null;

  const renderAiReview = () => {
    switch (workflowType) {
      case 'audio':
        return (
          <AudioAiReview
            workflowId={workflowId}
            onReviewComplete={onReviewComplete}
          />
        );
      case 'image':
        return (
          <ImageAiReview
            workflowId={workflowId}
            onReviewComplete={onReviewComplete}
          />
        );
      case 'text':
        return (
          <TextAiReview
            workflowId={workflowId}
            onReviewComplete={onReviewComplete}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Test {workflowType.charAt(0).toUpperCase() + workflowType.slice(1)}{' '}
            Workflow
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">{renderAiReview()}</div>

        <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
