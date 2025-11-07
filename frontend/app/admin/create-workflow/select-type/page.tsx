'use client';

import React, { useState } from 'react';
import { ArrowLeft, FormInput, Edit, Mic, Image } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function SelectType() {
  const [selectedType, setSelectedType] = useState('');
  const searchParams = useSearchParams();
  const workflowId = searchParams.get('workflowId');

  const inputTypes = [
    {
      id: 'form',
      name: 'Form',
      icon: FormInput,
      description: 'Create structured forms with fields',
    },
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

  const handleNext = () => {
    if (selectedType) {
      // Pass all current URL params to the builder
      const currentParams = new URLSearchParams(window.location.search);
      window.location.href = `/admin/create-workflow/builder/${selectedType}?${currentParams.toString()}`;
    }
  };

  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <div>
        <button
          onClick={() => {
            if (workflowId) {
              window.location.href = `/admin/create-workflow/workflow-details?workflowId=${workflowId}`;
            } else {
              // Go back to workflow details with the current params
              const params = new URLSearchParams(window.location.search);
              window.location.href = `/admin/create-workflow/workflow-details?${params.toString()}`;
            }
          }}
          className="mb-3 flex items-center gap-2 text-gray-600 hover:text-gray-900 sm:mb-4"
        >
          <ArrowLeft size={18} className="sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Back</span>
        </button>
        <h1 className="mb-1 text-xl font-semibold text-gray-900 sm:mb-2 sm:text-2xl lg:text-3xl">
          Select Input Type
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">
          Choose how users will input data for this workflow
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {inputTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`cursor-pointer rounded-lg border-2 p-4 text-center transition-all hover:border-green-600 hover:shadow-md sm:rounded-xl sm:p-5 lg:p-6 ${
              selectedType === type.id
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 sm:mb-4 sm:h-10 sm:w-10">
              <type.icon className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-gray-900 sm:mb-2 sm:text-base">
              {type.name}
            </h3>
            <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
              {type.description}
            </p>
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 sm:w-auto sm:px-6"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
