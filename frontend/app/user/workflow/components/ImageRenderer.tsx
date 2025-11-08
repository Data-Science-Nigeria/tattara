'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, Eye, Square, Save } from 'lucide-react';
import { useSaveDraft } from '../hooks/useSaveDraft';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerSubmitDataMutation } from '@/client/@tanstack/react-query.gen';
import AiReview from './AiReview';
import { toast } from 'sonner';

interface AiReviewData {
  form_id: string;
  extracted: Record<string, unknown>;
  missing_required: string[];
}

interface ImageRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'image';
    ocrEnabled?: boolean;
    maxFileSize?: number;
    allowedFormats?: string[];
  };
}

export default function ImageRenderer({ workflow }: ImageRendererProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [aiReviewData, setAiReviewData] = useState<AiReviewData | null>(null);
  const [aiProcessingLogId, setAiProcessingLogId] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
  });

  const { saveDraft, loadDraft, clearDraft, isSaving } = useSaveDraft({
    workflowId: workflow.id,
    type: 'image',
  });

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.fileName && draft?.imageData) {
      fetch(draft.imageData)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], draft.fileName, { type: 'image/jpeg' });
          setSelectedFile(file);
          setPreviewUrl(draft.imageData);
        })
        .catch(() => {});
    }
  }, [loadDraft]);

  const handleFileSelect = useCallback(
    (file: File) => {
      // Validate file size
      if (workflow.maxFileSize && file.size > workflow.maxFileSize) {
        toast.error(
          `File size exceeds ${workflow.maxFileSize / (1024 * 1024)}MB limit`
        );
        return;
      }

      // Validate file format
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (
        workflow.allowedFormats &&
        !workflow.allowedFormats.includes(fileExtension || '')
      ) {
        toast.error(
          `File format not supported. Allowed formats: ${workflow.allowedFormats.join(', ')}`
        );
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    },
    [workflow.maxFileSize, workflow.allowedFormats]
  );

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const openCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      setStream(mediaStream);
      setShowCamera(true);

      // Set video source after state update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      }, 100);
    } catch {
      toast.error(
        'Camera access denied or not available. Please use "Browse Files" instead.'
      );
    }
  }, []);

  const closeCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  }, [stream]);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      toast.error('Camera not ready. Please wait a moment and try again.');
      return;
    }

    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], 'camera-photo.jpg', {
            type: 'image/jpeg',
          });
          handleFileSelect(file);
          closeCamera();
        }
      },
      'image/jpeg',
      0.9
    );
  }, [handleFileSelect, closeCamera]);

  const handleAiReviewComplete = (
    reviewData: unknown,
    processingLogId: string
  ) => {
    setAiReviewData(reviewData as AiReviewData);
    setAiProcessingLogId(processingLogId);
  };

  const handleSave = async () => {
    if (!selectedFile || !previewUrl) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      saveDraft({
        fileName: selectedFile.name,
        imageData: reader.result as string,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAiReviewData(null);
    setAiProcessingLogId('');
    clearDraft();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;

    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Image = reader.result as string;

        await submitMutation.mutateAsync({
          body: {
            workflowId: workflow.id,
            data: {
              image: base64Image,
            },
            metadata: {
              type: 'image',
              fileName: selectedFile.name,
            },
            aiProcessingLogId: aiProcessingLogId,
          },
        });

        toast.success('Image submitted successfully!');
        window.location.href = '/user/overview';
      };
      reader.readAsDataURL(selectedFile);
    } catch {
      toast.error('Failed to submit image. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex justify-end gap-2">
        {selectedFile && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Reset
        </button>
      </div>
      <div className="space-y-6">
        {showCamera ? (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-lg bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="h-64 w-full object-cover"
              />
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex justify-center gap-4">
              <button
                onClick={capturePhoto}
                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-white hover:bg-green-700"
              >
                <Square className="h-5 w-5" />
                Capture Photo
              </button>

              <button
                onClick={closeCamera}
                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-3 text-white hover:bg-gray-700"
              >
                <X className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </div>
        ) : !selectedFile ? (
          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              dragActive
                ? 'border-green-500 bg-green-50'
                : 'border-gray-300 hover:border-green-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <Upload className="h-8 w-8 text-gray-600" />
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Upload Image
                </h3>
                <p className="text-gray-600">
                  Drag and drop your image here, or click to browse
                </p>
                {workflow.allowedFormats && (
                  <p className="mt-1 text-sm text-gray-500">
                    Supported formats:{' '}
                    {workflow.allowedFormats.join(', ').toUpperCase()}
                  </p>
                )}
                {workflow.maxFileSize && (
                  <p className="text-sm text-gray-500">
                    Max size: {workflow.maxFileSize / (1024 * 1024)}MB
                  </p>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  <Upload className="h-4 w-4" />
                  Browse Files
                </button>

                <button
                  onClick={openCamera}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                >
                  <Camera className="h-4 w-4" />
                  Take Photo
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={
                workflow.allowedFormats?.map((f) => `.${f}`).join(',') ||
                'image/*'
              }
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
              className="hidden"
            />

            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg border border-gray-200 p-4">
              <button
                onClick={handleReset}
                className="absolute top-2 right-2 rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-4">
                {previewUrl && (
                  <div className="flex-shrink-0">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  </div>
                )}

                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {selectedFile.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>

                  <button
                    onClick={() =>
                      previewUrl && window.open(previewUrl, '_blank')
                    }
                    className="mt-2 flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Size
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {workflow.ocrEnabled && (
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              🔍 OCR is enabled for this workflow. Text will be automatically
              extracted from your image.
            </p>
          </div>
        )}

        <AiReview
          workflowId={workflow.id}
          formData={{
            image: selectedFile ? selectedFile.name : '',
            fileName: selectedFile?.name || '',
          }}
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
