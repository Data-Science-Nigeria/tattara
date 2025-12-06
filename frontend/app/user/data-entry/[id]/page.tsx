'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';
import TextRenderer from '../components/TextRenderer';
import AudioRenderer from '../components/AudioRenderer';
import ImageRenderer from '../components/ImageRenderer';
import FormRenderer from '../components/FormSaver';

export default function WorkflowExecution() {
  const [currentStep, setCurrentStep] = useState('input');
  const [inputData, setInputData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const params = useParams();
  const workflowId = params.id as string;

  const { data: workflowData, isLoading } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId },
    }),
    enabled: !!workflowId,
  });

  const workflow = (
    workflowData as {
      data?: { id: string; name: string; enabledModes?: string[] };
    }
  )?.data;

  const steps = [
    { id: 'input', label: 'Complete this workflow' },
    { id: 'form', label: 'Fill form' },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[#008647]"></div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Workflow Not Found</h2>
        <p className="mb-6 text-gray-600">
          The workflow you&apos;re looking for doesn&apos;t exist or you
          don&apos;t have access to it.
        </p>
        <button
          onClick={() => (window.location.href = '/user/overview')}
          className="rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
        >
          Back to Overview
        </button>
      </div>
    );
  }

  const handleNext = async () => {
    if (currentStep === 'input' || currentStep === 'form') {
      if (!inputData.trim()) return;
      setIsProcessing(true);
      // Simulate AI processing delay
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep('form');
      }, 2000);
    }
  };

  const handlePrevious = () => {
    if (currentStep === 'form') {
      setCurrentStep('input');
    }
  };

  const renderStepContent = () => {
    const enabledModes = workflow.enabledModes || [];

    if (currentStep === 'input') {
      if (enabledModes.includes('text')) {
        return (
          <TextRenderer
            workflow={{ ...workflow, type: 'text', workflowConfigurations: [] }}
            onDataChange={setInputData}
            hideButtons={true}
          />
        );
      } else if (enabledModes.includes('audio')) {
        return (
          <AudioRenderer
            workflow={{
              ...workflow,
              type: 'audio',
              workflowConfigurations: [],
            }}
            onDataChange={setInputData}
            hideButtons={true}
          />
        );
      } else if (enabledModes.includes('image')) {
        return (
          <ImageRenderer
            workflow={{
              ...workflow,
              type: 'image',
              workflowConfigurations: [],
            }}
            onDataChange={setInputData}
            hideButtons={true}
          />
        );
      }
    } else if (currentStep === 'form') {
      const workflowType = enabledModes.includes('text')
        ? 'text'
        : enabledModes.includes('audio')
          ? 'audio'
          : 'image';
      return (
        <FormRenderer
          workflowId={workflow.id}
          workflowType={workflowType as 'text' | 'audio' | 'image'}
          inputData={inputData}
        />
      );
    }

    return <div>Unsupported workflow type</div>;
  };

  return (
    <div className="relative min-h-screen p-3 sm:p-6">
      <div className="w-full">
        <div className="mb-6 px-0 sm:mb-8 sm:px-2">
          <h1 className="text-xl font-semibold text-gray-800 sm:text-2xl">
            {workflow.name}
          </h1>
        </div>

        {/* Step Navigation */}
        <div className="mb-6 px-0 sm:px-2">
          <div className="flex space-x-8 border-b border-gray-200">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`border-b-2 px-1 pb-2 text-sm font-medium whitespace-nowrap ${
                  currentStep === step.id
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500'
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between border-t border-gray-200 pt-6">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 'input'}
            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>

          {currentStep === 'input' && (
            <button
              onClick={handleNext}
              disabled={!inputData.trim() || isProcessing}
              className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Next'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
