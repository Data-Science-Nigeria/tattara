'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import WorkflowDetailsForm from './components/WorkflowDetailsForm';

export default function WorkflowDetails() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const programId = searchParams.get('programId');
  const workflowId = searchParams.get('workflowId');
  const isEditing = !!workflowId;

  const handleNext = (name: string, description: string, type: string) => {
    if (isEditing && workflowId) {
      router.push(
        `/admin/create-workflow/builder/${type}?workflowId=${workflowId}`
      );
    } else if (programId) {
      const params = new URLSearchParams({
        programId,
        name,
        description,
      });
      router.push(
        `/admin/create-workflow/builder/${type}?${params.toString()}`
      );
    }
  };

  const handleBack = () => {
    router.push('/admin/create-workflow');
  };

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <div>
        <button
          onClick={handleBack}
          className="mb-3 flex items-center gap-2 text-gray-600 hover:text-gray-900 sm:mb-4"
        >
          <ArrowLeft size={18} className="sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Back</span>
        </button>
        <h1 className="mb-1 text-xl font-semibold text-gray-900 sm:mb-2 sm:text-2xl lg:text-3xl">
          {isEditing ? 'Edit Workflow' : 'Create Workflow'}
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">
          {isEditing
            ? 'Update workflow details and input type'
            : 'Enter workflow details and select input type'}
        </p>
      </div>

      <div className="max-w-4xl">
        <WorkflowDetailsForm
          workflowId={workflowId || undefined}
          onNext={handleNext}
        />
      </div>
    </div>
  );
}
