'use client';

import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface WorkflowBuilderLayoutProps {
  title: string;
  description: string;
  currentStep: string;
  setCurrentStep: (step: string) => void;
  steps: { id: string; label: string }[];
  children: ReactNode;
  onSave: () => void;
  isSaving?: boolean;
  saveButtonText?: string;
  canProceed?: boolean;
}

export default function WorkflowBuilderLayout({
  title,
  description,
  currentStep,
  setCurrentStep,
  steps,
  children,
  onSave,
  isSaving = false,
  saveButtonText = 'Save Workflow',
  canProceed = true,
}: WorkflowBuilderLayoutProps) {
  return (
    <div className="space-y-8 p-8">
      <div>
        <button
          onClick={() => window.history.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} />
          Back
        </button>
        <h1 className="mb-2 text-3xl font-semibold text-gray-900">{title}</h1>
        <p className="text-gray-600">{description}</p>
      </div>

      {/* Step Navigation */}
      <div className="flex space-x-4 border-b border-gray-200">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`cursor-default border-b-2 px-1 pb-2 text-sm font-medium ${
              currentStep === step.id
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500'
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>

      <div className="max-w-4xl space-y-6">{children}</div>

      {/* Navigation Buttons */}
      <div className="flex justify-between border-t border-gray-200 pt-6">
        <button
          onClick={() => {
            const currentIndex = steps.findIndex(
              (step) => step.id === currentStep
            );
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].id);
            }
          }}
          disabled={steps.findIndex((step) => step.id === currentStep) === 0}
          className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>

        <button
          onClick={() => {
            const currentIndex = steps.findIndex(
              (step) => step.id === currentStep
            );
            const isLastStep = currentIndex === steps.length - 1;

            if (isLastStep) {
              onSave();
            } else {
              setCurrentStep(steps[currentIndex + 1].id);
            }
          }}
          disabled={isSaving || !canProceed}
          className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {(() => {
            const currentIndex = steps.findIndex(
              (step) => step.id === currentStep
            );
            const isLastStep = currentIndex === steps.length - 1;

            if (isSaving) return 'Saving...';
            if (isLastStep) return saveButtonText;
            return 'Next';
          })()}
        </button>
      </div>
    </div>
  );
}
