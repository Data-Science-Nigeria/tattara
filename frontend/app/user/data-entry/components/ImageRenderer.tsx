'use client';

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { X, Eye, Save } from 'lucide-react';
import { useSaveDraft } from '../hooks/useSaveDraft';
import FormRenderer from './FormSaver';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';
import { getLanguageName } from '@/lib/language-utils';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [imageData, setImageData] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: workflowData } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflow.id },
    }),
  });

  const supportedLanguages = useMemo(
    () =>
      (workflowData as { data?: { supportedLanguages?: string[] } })?.data
        ?.supportedLanguages || [],
    [workflowData]
  );

  useEffect(() => {
    if (supportedLanguages.length > 0 && !selectedLanguage) {
      setSelectedLanguage(supportedLanguages[0]);
    }
  }, [supportedLanguages, selectedLanguage]);

  const { saveDraft, loadDraft, clearDraft, isSaving } = useSaveDraft({
    workflowId: workflow.id,
    type: 'image',
  });

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.fileNames && draft?.imageData) {
      Promise.all(
        draft.imageData.map((data: string, idx: number) =>
          fetch(data)
            .then((res) => res.blob())
            .then(
              (blob) =>
                new File([blob], draft.fileNames[idx], { type: 'image/jpeg' })
            )
        )
      )
        .then((files) => {
          setSelectedFiles(files);
          setPreviewUrls(draft.imageData);
          setImageData(draft.imageData);
        })
        .catch(() => {});
    }
  }, [loadDraft]);

  const handleFileSelect = useCallback((files: FileList | File[]) => {
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

    Promise.all(
      fileArray.map((file) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      })
    ).then(setImageData);
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

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleSave = async () => {
    if (selectedFiles.length === 0 || imageData.length === 0) return;
    saveDraft({
      fileNames: selectedFiles.map((f) => f.name),
      imageData: imageData,
    });
  };

  const handleReset = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setShowForm(false);
    setImageData([]);
    clearDraft();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessingComplete = () => {
    setShowForm(true);
  };

  useEffect(() => {
    if (onDataChange && imageData.length > 0) {
      onDataChange(JSON.stringify(imageData));
    }
  }, [imageData, onDataChange]);

  if (showForm && !hideButtons) {
    return (
      <FormRenderer
        workflowId={workflow.id}
        workflowType="image"
        inputData={imageData}
        onProcessingComplete={handleProcessingComplete}
        language={selectedLanguage}
      />
    );
  }

  return (
    <div className="rounded-lg border border-[#D2DDF5] bg-white p-6">
      <div className="mb-4 flex justify-end gap-2">
        {selectedFiles.length > 0 && (
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
        {supportedLanguages.length === 1 ? (
          <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-green-600 sm:px-4 sm:text-sm">
            {getLanguageName(supportedLanguages[0])}
          </div>
        ) : supportedLanguages.length > 1 ? (
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
                {getLanguageName(lang)}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="space-y-6">
        {selectedFiles.length === 0 ? (
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
                  Drop your files here, or click to upload.
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Accepted formats: PDF, JPG, PNG. Multiple files supported.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) =>
                e.target.files && handleFileSelect(e.target.files)
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

              <div className="space-y-4">
                <div className="font-medium text-green-600">
                  ✓ {selectedFiles.length} image(s) selected
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {previewUrls.map((url, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={url}
                        alt={`Preview ${idx + 1}`}
                        className="h-32 w-full rounded-lg object-cover"
                      />
                      <button
                        onClick={() => window.open(url, '_blank')}
                        className="absolute right-2 bottom-2 rounded bg-blue-600 p-1 text-white hover:bg-blue-700"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  ))}
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
            language={selectedLanguage}
          />
        )}
      </div>
    </div>
  );
}
