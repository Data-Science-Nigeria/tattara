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
    <div className="space-y-8 p-8">
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
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">
          Select Input Type
        </h1>
        <p className="text-gray-600">
          Choose how users will input data for this workflow
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {inputTypes.map((type) => (
          <div
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`cursor-pointer rounded-xl border-2 p-6 text-center transition-all hover:border-green-600 hover:shadow-md ${
              selectedType === type.id
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <type.icon className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="mb-2 text-sm font-medium text-gray-900">
              {type.name}
            </h3>
            <p className="text-xs text-gray-600">{type.description}</p>
          </div>
        ))}
      </div>

      {selectedType && (
        <div className="flex justify-end">
          <button
            onClick={handleNext}
            className="rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
