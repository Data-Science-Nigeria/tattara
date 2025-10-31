'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';

interface Workflow {
  name?: string;
  description?: string;
}

export default function WorkflowDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const programId = searchParams.get('programId');
  const workflowId = searchParams.get('workflowId');
  const isEditing = !!workflowId;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Fetch workflow data if editing
  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflowId || '' },
    }),
    enabled: isEditing,
  });

  useEffect(() => {
    if (workflowData) {
      const workflow = (workflowData as { data?: Workflow })?.data;
      setName(workflow?.name || '');
      setDescription(workflow?.description || '');
    }
  }, [workflowData]);

  const handleNext = () => {
    if (!name.trim()) return;

    if (isEditing && workflowId) {
      router.push(
        `/admin/create-workflow/select-type?workflowId=${workflowId}`
      );
    } else if (programId) {
      const params = new URLSearchParams({
        programId,
        name: name.trim(),
        description: description.trim(),
      });
      router.push(`/admin/create-workflow/select-type?${params.toString()}`);
    }
  };

  const handleBack = () => {
    router.push('/admin/create-workflow');
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <div>
        <button
          onClick={handleBack}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          {isEditing ? 'Edit Workflow' : 'Create Workflow'}
        </h1>
        <p className="text-gray-600">
          {isEditing
            ? 'Update workflow details'
            : 'Enter workflow name and description'}
        </p>
      </div>

      <div className="mx-auto max-w-2xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div className="space-y-6">
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
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Enter workflow name"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-green-500 focus:ring-1 focus:ring-green-500 focus:outline-none"
                placeholder="Enter workflow description"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleNext}
              disabled={!name.trim()}
              className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
