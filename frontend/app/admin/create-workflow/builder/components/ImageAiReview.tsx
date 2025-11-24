import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerProcessAiMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { Upload, Camera, Eye } from 'lucide-react';

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
  const [aiReviewData, setAiReviewData] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const aiProcessMutation = useMutation({
    ...collectorControllerProcessAiMutation(),
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleProcess = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    try {
      const imageBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });

      const aiResponse = await aiProcessMutation.mutateAsync({
        body: {
          workflowId,
          processingType: 'image',
          text: imageBase64,
        },
      });

      const responseData = aiResponse as {
        data?: { aiData?: any; aiProcessingLogId?: string };
      };

      const reviewData = responseData?.data?.aiData;
      setAiReviewData(reviewData);

      if (reviewData) {
        toast.success('Image processed successfully!');
        onReviewComplete?.(
          reviewData,
          responseData?.data?.aiProcessingLogId || ''
        );
        onAiTestStatusChange?.(true);
      }
    } catch (error) {
      toast.error('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        {!selectedFile ? (
          <div className="flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Upload className="h-8 w-8 text-blue-600" />
            </div>
            <p className="mb-4 text-gray-600">
              Upload an image or take a photo
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <Upload className="mr-2 inline h-4 w-4" />
              Choose Image
            </button>
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
              Choose different image
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
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <h3 className="mb-3 text-lg font-semibold">AI Processing Results</h3>
          {aiReviewData.extractedText && (
            <div className="mb-4">
              <strong>Extracted Text:</strong>
              <div className="mt-2 rounded-lg bg-blue-50 p-3">
                <p className="text-blue-800">{aiReviewData.extractedText}</p>
              </div>
            </div>
          )}
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
          <button
            onClick={() => {
              setAiReviewData(null);
              setSelectedFile(null);
              setPreviewUrl(null);
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
