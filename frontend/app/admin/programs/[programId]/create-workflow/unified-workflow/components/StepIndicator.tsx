'use client';

interface StepIndicatorProps {
  currentStep: number;
  maxSteps: number;
  isExternalMode: boolean | null;
  onStepClick: (step: number) => void;
  canProceedToStep: (step: number) => boolean;
}

const getStepLabel = (step: number, isExternalMode: boolean | null): string => {
  if (step === 1) return 'Workflow Details';

  if (isExternalMode === true) {
    switch (step) {
      case 2:
        return 'External Configuration';
      case 3:
        return 'AI Field Mapping';
      case 4:
        return 'Create Workflow';
      default:
        return `Step ${step}`;
    }
  } else if (isExternalMode === false) {
    switch (step) {
      case 2:
        return 'Manual Fields';
      default:
        return `Step ${step}`;
    }
  }

  return `Step ${step}`;
};

const getStepDescription = (
  step: number,
  isExternalMode: boolean | null
): string => {
  if (step === 1)
    return 'Enter workflow name, description, and choose integration type';

  if (isExternalMode === true) {
    switch (step) {
      case 2:
        return 'Configure external connection and select program/dataset';
      case 3:
        return 'Set up AI field extraction and mapping';
      case 4:
        return 'Review and create your workflow';
      default:
        return '';
    }
  } else if (isExternalMode === false) {
    switch (step) {
      case 2:
        return 'Create custom fields for your workflow';
      default:
        return '';
    }
  }

  return '';
};

export default function StepIndicator({
  currentStep,
  maxSteps,
  isExternalMode,
  onStepClick,
  canProceedToStep,
}: StepIndicatorProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: maxSteps }, (_, i) => {
        const stepNumber = i + 1;
        const isActive = currentStep === stepNumber;
        const isCompleted = currentStep > stepNumber;
        const canAccess = canProceedToStep(stepNumber);

        return (
          <div key={stepNumber} className="flex items-start gap-4">
            {/* Step Circle */}
            <div
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 font-semibold ${
                isActive
                  ? 'border-green-600 bg-green-600 text-white'
                  : isCompleted
                    ? 'border-green-600 bg-green-100 text-green-600'
                    : canAccess
                      ? 'cursor-pointer border-gray-300 bg-white text-gray-600 hover:border-green-600'
                      : 'border-gray-200 bg-gray-100 text-gray-400'
              }`}
              onClick={() => canAccess && onStepClick(stepNumber)}
            >
              {stepNumber}
            </div>

            {/* Step Content */}
            <div className="min-w-0 flex-1">
              <h3
                className={`font-medium ${
                  isActive
                    ? 'text-green-600'
                    : isCompleted
                      ? 'text-green-600'
                      : canAccess
                        ? 'text-gray-900'
                        : 'text-gray-400'
                }`}
              >
                {getStepLabel(stepNumber, isExternalMode)}
              </h3>
              <p
                className={`text-sm ${
                  isActive || isCompleted
                    ? 'text-gray-600'
                    : canAccess
                      ? 'text-gray-500'
                      : 'text-gray-400'
                }`}
              >
                {getStepDescription(stepNumber, isExternalMode)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
