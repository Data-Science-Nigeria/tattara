import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/app/store/use-auth-store';
import AiResponseDisplay from '../field-mapping/components/AiResponseDisplay';

interface ImageAiReviewProps {
  workflowId: string;
  onReviewComplete?: (reviewData: unknown, logId: string) => void;
  onAiTestStatusChange?: (hasCompleted: boolean) => void;
  supportedLanguages?: string[];
}

export default function ImageAiReview({
  workflowId,
  onReviewComplete,
  onAiTestStatusChange,
  supportedLanguages = ['English'],
}: ImageAiReviewProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    supportedLanguages[0] || 'English'
  );

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

  const handleFileSelect = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const MAX_SIZE = 80 * 1024 * 1024; // 80MB
    const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > MAX_SIZE) {
      toast.error(
        `Total file size exceeds 80MB. Current: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`
      );
      return;
    }

    setSelectedFiles(fileArray);
    const urls = fileArray.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('workflowId', workflowId);
      formData.append('processingType', 'image');
      formData.append('language', selectedLanguage);
      selectedFiles.forEach((file) => formData.append('files', file));

      const aiResponse = await aiProcessMutation.mutateAsync({ formData });

      setAiReviewData(aiResponse);
      toast.success(`${selectedFiles.length} image(s) processed successfully!`);
      onReviewComplete?.(aiResponse, aiResponse?.data?.aiProcessingLogId || '');
      onAiTestStatusChange?.(true);
    } catch {
      toast.error('Failed to process images');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Test Image Processing
        </h3>
        {supportedLanguages.length === 1 ? (
          <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-green-600 sm:px-4 sm:text-sm">
            {supportedLanguages[0]}
          </div>
        ) : (
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-green-600 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-sm"
          >
            {supportedLanguages.map((lang) => (
              <option
                key={lang}
                value={lang}
                className="bg-white text-gray-900"
              >
                {lang}
              </option>
            ))}
          </select>
        )}
      </div>
      <div
        className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:border-green-500 hover:bg-green-50"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {selectedFiles.length === 0 ? (
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
                Drop your files here, or click to upload.
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Accepted formats: PDF, JPG, PNG. Multiple files supported.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFileSelect(e.target.files)
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {previewUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Preview ${idx + 1}`}
                  className="h-32 w-full rounded-lg object-cover"
                />
              ))}
            </div>
            <div className="text-green-600">
              ✓ {selectedFiles.length} image(s) selected
            </div>
            <button
              onClick={() => {
                setSelectedFiles([]);
                setPreviewUrls([]);
                setAiReviewData(null);
              }}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Upload different images
            </button>
          </div>
        )}
      </div>

      {selectedFiles.length > 0 && !aiReviewData && (
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isProcessing
            ? `Processing ${selectedFiles.length} Image(s)...`
            : `Process ${selectedFiles.length} Image(s) with AI`}
        </button>
      )}

      {aiReviewData && (
        <AiResponseDisplay
          responseData={aiReviewData}
          onReset={() => {
            setAiReviewData(null);
            setSelectedFiles([]);
            setPreviewUrls([]);
          }}
        />
      )}
    </div>
  );
}
