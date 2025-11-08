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
  onSaveAndContinue?: () => void;
  isSaving?: boolean;
  saveButtonText?: string;
  canProceed?: boolean;
  isEditMode?: boolean;
}

export default function WorkflowBuilderLayout({
  title,
  description,
  currentStep,
  setCurrentStep,
  steps,
  children,
  onSave,
  onSaveAndContinue,
  isSaving = false,
  saveButtonText = 'Save Workflow',
  canProceed = true,
  isEditMode = false,
}: WorkflowBuilderLayoutProps) {
  return (
    <div className="space-y-4 p-3 sm:space-y-6 sm:p-6 lg:space-y-8 lg:p-8">
      <div>
        <button
          onClick={() => window.history.back()}
          className="mb-3 flex items-center gap-2 text-gray-600 hover:text-gray-900 sm:mb-4"
        >
          <ArrowLeft size={16} className="sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">Back</span>
        </button>
        <h1 className="mb-2 text-xl font-semibold text-gray-900 sm:text-2xl lg:text-3xl">
          {title}
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">{description}</p>
      </div>

      {/* Step Navigation */}
      <div className="overflow-x-auto">
        <div className="flex min-w-max space-x-4 border-b border-gray-200">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`cursor-default border-b-2 px-1 pb-2 text-xs font-medium whitespace-nowrap sm:text-sm ${
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

      <div className="max-w-4xl space-y-4 sm:space-y-6">{children}</div>

      {/* Navigation Buttons */}
      <div className="flex flex-col justify-between gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:gap-0 sm:pt-6">
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
          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
        >
          Previous
        </button>

        {isEditMode ? (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <button
              onClick={onSave}
              disabled={isSaving || !canProceed}
              className="w-full rounded-lg border border-green-600 px-4 py-2 text-sm text-green-600 hover:bg-green-50 disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            {onSaveAndContinue && (
              <button
                onClick={onSaveAndContinue}
                disabled={isSaving || !canProceed}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
              >
                {isSaving ? 'Saving...' : 'Save & Continue'}
              </button>
            )}
          </div>
        ) : (
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
            className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto sm:px-6 sm:text-base"
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
        )}
      </div>
    </div>
  );
}
