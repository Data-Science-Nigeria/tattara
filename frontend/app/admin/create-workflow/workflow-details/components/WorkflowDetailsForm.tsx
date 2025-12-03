'use client';

import React, { useState, useEffect } from 'react';
import { Edit, Mic, Image } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';
import { client } from '@/client/client.gen';
import { toast } from 'sonner';

interface Workflow {
  name?: string;
  description?: string;
}

interface WorkflowDetailsFormProps {
  workflowId?: string;
  onNext: (name: string, description: string, type: string) => void;
}

export default function WorkflowDetailsForm({
  workflowId,
  onNext,
}: WorkflowDetailsFormProps) {
  const isEditing = !!workflowId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const inputTypes = [
    {
      id: 'text',
      name: 'Text',
      icon: Edit,
      description: 'AI-powered text input and processing',
    },
    {
      id: 'audio',
      name: 'Audio',
      icon: Mic,
      description: 'Voice recording with transcription',
    },
    {
      id: 'image',
      name: 'Image',
      icon: Image,
      description: 'Image capture with OCR processing',
    },
  ];

  // Fetch workflow data if editing
  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: isEditing,
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      workflowId,
      name,
      description,
    }: {
      workflowId: string;
      name: string;
      description: string;
    }) => {
      const { data } = await client.put({
        url: `/api/v1/workflows/${workflowId}`,
        body: { name, description },
        headers: { 'Content-Type': 'application/json' },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Workflow updated successfully!');
      setIsSaving(false);
    },
    onError: () => {
      toast.error('Failed to update workflow');
      setIsSaving(false);
    },
  });

  useEffect(() => {
    if (workflowData) {
      const workflow = (workflowData as { data?: Workflow })?.data;
      setName(workflow?.name || '');
      setDescription(workflow?.description || '');
    }
  }, [workflowData]);

  const handleSave = async () => {
    if (!name.trim() || !description.trim() || !workflowId) return;

    setIsSaving(true);
    await updateMutation.mutateAsync({
      workflowId,
      name: name.trim(),
      description: description.trim(),
    });
  };

  const handleNext = async () => {
    if (!name.trim() || !description.trim() || !selectedType) return;

    if (isEditing && workflowId) {
      await handleSave();
      if (!updateMutation.isError) {
        onNext(name.trim(), description.trim(), selectedType);
      }
    } else {
      onNext(name.trim(), description.trim(), selectedType);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8">
      <div className="space-y-6">
        {/* Workflow Details Section */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Workflow Details
          </h2>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Workflow Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Enter workflow name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Enter workflow description"
                required
              />
            </div>
          </div>
        </div>

        {/* Input Type Selection */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Input Type
          </h2>
          <p className="mb-4 text-sm text-gray-600">
            Choose how users will input data for this workflow
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {inputTypes.map((type) => (
              <div
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-green-600 hover:shadow-md ${
                  selectedType === type.id
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <type.icon className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="mb-2 text-sm font-medium text-gray-900">
                  {type.name}
                </h3>
                <p className="text-xs leading-relaxed text-gray-600">
                  {type.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 sm:flex-row sm:justify-end sm:gap-3">
          {isEditing ? (
            <div>
              <button
                onClick={handleSave}
                disabled={!name.trim() || !description.trim() || isSaving}
                className="w-full rounded-lg border border-green-600 px-6 py-2 text-sm font-medium text-green-600 hover:bg-green-50 disabled:opacity-50 sm:w-auto"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleNext}
                disabled={
                  !name.trim() ||
                  !description.trim() ||
                  !selectedType ||
                  isSaving
                }
                className="w-full rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:w-auto"
              >
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleNext}
              disabled={!name.trim() || !description.trim() || !selectedType}
              className="w-full rounded-lg bg-green-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 sm:w-auto"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
