import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/use-auth-store';
import AiResponseDisplay from '../../field-mapping/components/AiResponseDisplay';

interface ImageAiReviewProps {
  workflowId: string;
  onReviewComplete?: (reviewData: unknown, logId: string) => void;
  onAiTestStatusChange?: (hasCompleted: boolean) => void;
}

export default function ImageAiReview({
  workflowId,
  onReviewComplete,
  onAiTestStatusChange,
}: ImageAiReviewProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiProcessMutation = useMutation({
    mutationFn: async ({ formData }: { formData: FormData }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/collector/process-ai`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
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

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files?.[0] && files[0].type.startsWith('image/')) {
      handleFileSelect(files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('workflowId', workflowId);
      formData.append('processingType', 'image');
      formData.append('files', selectedFile);

      const aiResponse = await aiProcessMutation.mutateAsync({ formData });

      setAiReviewData(aiResponse);
      toast.success('Image processed successfully!');
      onReviewComplete?.(aiResponse, aiResponse?.data?.aiProcessingLogId || '');
      onAiTestStatusChange?.(true);
    } catch {
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:border-green-500 hover:bg-green-50"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {!selectedFile ? (
          <div
            className="cursor-pointer space-y-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src="/camera.svg"
              alt="Camera icon"
              className="mx-auto h-16 w-16"
            />
            <div>
              <p className="text-gray-600">
                Drop your file here, or click to upload.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: PDF, JPG, PNG.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-48 rounded-lg object-contain"
                />
              </div>
            )}
            <div className="text-green-600">
              ✓ Image selected: {selectedFile.name}
            </div>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
                setAiReviewData(null);
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Upload different image
            </button>
          </div>
        )}
      </div>

      {selectedFile && !aiReviewData && (
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing Image...' : 'Process with AI'}
        </button>
      )}

      {aiReviewData && (
        <AiResponseDisplay
          responseData={aiReviewData}
          onReset={() => {
            setAiReviewData(null);
            setSelectedFile(null);
            setPreviewUrl(null);
          }}
        />
      )}
    </div>
  );
}
