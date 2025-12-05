'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Eye, Save } from 'lucide-react';
import { useSaveDraft } from '../hooks/useSaveDraft';
import FormRenderer from './FormSaver';

interface ImageRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'image';
    workflowConfigurations: Array<{
      type: string;
      configuration: Record<string, unknown>;
    }>;
  };
  onDataChange?: (data: string) => void;
  hideButtons?: boolean;
}

export default function ImageRenderer({
  workflow,
  onDataChange,
  hideButtons = false,
}: ImageRendererProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [imageData, setImageData] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          setImageData(draft.imageData);
        })
        .catch(() => {});
    }
  }, [loadDraft]);

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64 for AI processing
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageData(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

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

  const handleSave = async () => {
    if (!selectedFile || !imageData) return;
    saveDraft({
      fileName: selectedFile.name,
      imageData: imageData,
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setShowForm(false);
    setImageData('');
    clearDraft();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessingComplete = () => {
    setShowForm(true);
  };

  useEffect(() => {
    if (onDataChange && imageData) {
      onDataChange(imageData);
    }
  }, [imageData, onDataChange]);

  if (showForm && !hideButtons) {
    return (
      <FormRenderer
        workflowId={workflow.id}
        workflowType="image"
        inputData={imageData}
        onProcessingComplete={handleProcessingComplete}
      />
    );
  }

  return (
    <div className="rounded-lg border border-[#D2DDF5] bg-white p-6">
      <div className="mb-4 flex justify-end gap-2">
        {selectedFile && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            <Save size={14} className="sm:h-4 sm:w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 sm:px-4 sm:text-sm"
        >
          Reset
        </button>
      </div>
      <div className="space-y-6">
        {!selectedFile ? (
          <div
            className={`relative cursor-pointer rounded-lg border-4 border-dashed border-[#DBDCEA] p-8 text-center transition-colors ${
              dragActive ? 'border-green-500 bg-green-50' : ''
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="space-y-4">
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
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
              className="hidden"
            />
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
                    className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 sm:text-sm"
                  >
                    <Eye size={14} className="sm:h-4 sm:w-4" />
                    View Full Size
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {!hideButtons && (
          <FormRenderer
            workflowId={workflow.id}
            workflowType="image"
            inputData={imageData}
            onProcessingComplete={handleProcessingComplete}
          />
        )}
      </div>
    </div>
  );
}
