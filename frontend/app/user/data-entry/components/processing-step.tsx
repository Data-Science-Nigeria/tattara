'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, RotateCcw, Trash2 } from 'lucide-react';
import type { ProcessingResult } from '@/app/user/data-entry/page';

interface ProcessingStepProps {
  file?: File | null;
  text?: string;
  audio?: Blob | null;
  formData?: ProcessingResult['data'] | null;
  onProcessingComplete: (result: ProcessingResult) => void;
}

export function ProcessingStep({
  file,
  text,
  audio,
  formData,
  onProcessingComplete,
}: ProcessingStepProps) {
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingTime, setProcessingTime] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [processingAttempt, setProcessingAttempt] = useState(1);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>('');
  const [audioToTextComplete, setAudioToTextComplete] = useState(false);
  const [textToFormProcessing, setTextToFormProcessing] = useState(false);
  const [textToFormComplete, setTextToFormComplete] = useState(false);

  useEffect(() => {
    if (audio) {
      const url = URL.createObjectURL(audio);
      setAudioUrl(url);
      setTranscribedText(
        'Abeni Coker\n21\nFemale\nMy Symptoms are Headache, Body Pains,...'
      );

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [audio]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProcessingTime((prev) => prev + 0.1);
    }, 100);

    const processingTimer = setTimeout(() => {
      setIsProcessing(false);
      setShowResults(true);
      if (audio) {
        setAudioToTextComplete(true);
      }
      clearInterval(timer);

      if (formData) {
        const result: ProcessingResult = {
          success: true,
          data: formData,
          processingTime: 1.2,
          inputTokens: 150,
          outputTokens: 150,
        };
        setTimeout(() => {
          onProcessingComplete(result);
        }, 1000);
      } else if (!audio) {
        const result: ProcessingResult =
          processingAttempt === 1
            ? {
                success: false,
                error: 'No Data Found',
                processingTime: 7.13,
                inputTokens: 3303,
                outputTokens: 3303,
              }
            : {
                success: true,
                data: {
                  firstName: 'Abeni',
                  lastName: 'Coker',
                  age: '21',
                  gender: 'Female',
                  dateOfSymptoms: '2025-08-17',
                  testResults: 'Unknown',
                  mosquitoSpecies: 'Mixed',
                  symptoms: ['Headache', 'Drowsiness'],
                },
                processingTime: 5.2,
                inputTokens: 3303,
                outputTokens: 3303,
              };

        setTimeout(() => {
          onProcessingComplete(result);
        }, 2000);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearTimeout(processingTimer);
    };
  }, [onProcessingComplete, processingAttempt, audio]);

  const handleContinueToForm = () => {
    setTextToFormProcessing(true);
    setProcessingTime(0);

    const timer = setInterval(() => {
      setProcessingTime((prev) => prev + 0.1);
    }, 100);

    setTimeout(() => {
      setTextToFormProcessing(false);
      setTextToFormComplete(true);
      clearInterval(timer);

      const result: ProcessingResult =
        processingAttempt === 1
          ? {
              success: false,
              error: 'No Data Found',
              processingTime: 7.13,
              inputTokens: 3303,
              outputTokens: 3303,
            }
          : {
              success: true,
              data: {
                firstName: 'Abeni',
                lastName: 'Coker',
                age: '21',
                gender: 'Female',
                dateOfSymptoms: '2025-08-17',
                testResults: 'Unknown',
                mosquitoSpecies: 'Mixed',
                symptoms: ['Headache', 'Drowsiness'],
              },
              processingTime: 7.13,
              inputTokens: 3303,
              outputTokens: 3303,
            };

      setTimeout(() => {
        onProcessingComplete(result);
      }, 2000);
    }, 3000);
  };

  const handleProcessAgain = () => {
    if (audio && !textToFormProcessing && !textToFormComplete) {
      // For audio-to-text retry
      setIsProcessing(true);
      setShowResults(false);
      setAudioToTextComplete(false);
      setProcessingTime(0);
      setProcessingAttempt((prev) => prev + 1);
    } else if (audio && textToFormComplete) {
      // For text-to-form retry
      setTextToFormProcessing(true);
      setTextToFormComplete(false);
      setProcessingTime(0);
      setProcessingAttempt((prev) => prev + 1);
    } else {
      // For non-audio workflows
      setIsProcessing(true);
      setShowResults(false);
      setProcessingTime(0);
      setProcessingAttempt((prev) => prev + 1);
    }
  };

  const getTitle = () => {
    if (formData) return 'Form Data';
    if (audio) return 'Record Audio';
    if (text) return 'Write Text';
    return 'Upload Picture';
  };

  const getProcessingType = () => {
    if (formData) return 'Form Validation';
    if (audio && !audioToTextComplete) return 'Audio to Text';
    if (audio && audioToTextComplete) return 'Text to Data form';
    if (text) return 'Text to Form';
    return 'Image to Form';
  };

  const title = getTitle();
  const processingType = getProcessingType();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-semibold text-gray-900">{title}</h1>
        <div className="h-px bg-gray-200"></div>
      </div>

      {audio && audioUrl && (
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
              <h2 className="text-lg font-semibold text-green-600">
                Recording Complete
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove Audio
            </Button>
          </div>

          <div className="mb-6 flex items-center justify-center gap-4">
            <button className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 transition-colors hover:bg-green-700">
              <svg
                className="ml-1 h-6 w-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div className="max-w-md flex-1">
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: '33%' }}
                  ></div>
                </div>
              </div>
              <div className="mt-1 flex justify-between text-sm text-gray-600">
                <span>0:05</span>
                <span>0:15</span>
              </div>
            </div>
          </div>

          <Button variant="outline" className="mb-4 bg-transparent">
            Re-record Audio
          </Button>
        </div>
      )}

      {file && (
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-green-600 hover:text-green-700"
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Remove Image
            </Button>
          </div>

          <div className="rounded-lg border-2 border-dashed border-gray-200 p-8 text-center">
            <div className="mx-auto mb-4 flex h-32 w-24 items-center justify-center rounded border bg-gray-100">
              <img
                src="/medical-form-document.jpg"
                alt="Uploaded document"
                className="h-full w-full rounded object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {text && (
        <div className="p-6">
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="mb-2 text-sm text-gray-600">
              You can edit text below:
            </p>
            <div className="min-h-[200px] rounded border bg-white p-4">
              <pre className="text-sm whitespace-pre-wrap text-gray-900">
                {text}
              </pre>
            </div>
          </div>
        </div>
      )}

      {formData && (
        <div className="p-6">
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="mb-2 text-sm text-gray-600">Form data submitted:</p>
            <div className="space-y-2 rounded border bg-white p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">First Name:</span>{' '}
                  {formData.firstName}
                </div>
                <div>
                  <span className="font-medium">Last Name:</span>{' '}
                  {formData.lastName}
                </div>
                <div>
                  <span className="font-medium">Age:</span> {formData.age}
                </div>
                <div>
                  <span className="font-medium">Gender:</span> {formData.gender}
                </div>
                <div>
                  <span className="font-medium">Date of Symptoms:</span>{' '}
                  {formData.dateOfSymptoms}
                </div>
                <div>
                  <span className="font-medium">Test Results:</span>{' '}
                  {formData.testResults}
                </div>
                <div>
                  <span className="font-medium">Mosquito Species:</span>{' '}
                  {formData.mosquitoSpecies}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Symptoms:</span>{' '}
                  {formData.symptoms?.join(', ')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">
          AI Processing: {processingType}
        </h2>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4">
            <p className="mb-1 text-sm text-gray-600">Processing Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {isProcessing || textToFormProcessing
                ? `${processingTime.toFixed(1)}s`
                : '7.13s'}
            </p>
          </div>

          <Card className="p-4">
            <p className="mb-1 text-sm text-gray-600">Input Tokens</p>
            <p className="text-2xl font-bold text-gray-900">3,303</p>
          </Card>

          <Card className="p-4">
            <p className="mb-1 text-sm text-gray-600">Output Tokens</p>
            <p className="text-2xl font-bold text-gray-900">3,303</p>
          </Card>
        </div>

        {(showResults || textToFormComplete) && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Processing Complete</p>
                <p className="text-sm text-gray-600">
                  Processed with{' '}
                  {audio && !audioToTextComplete
                    ? 'Whisper Large'
                    : 'Llama 4 Scout 17B'}
                </p>
              </div>
              <Button
                onClick={handleProcessAgain}
                variant="outline"
                className="border-green-600 bg-transparent text-green-600 hover:bg-green-50"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Process Again
              </Button>
            </div>

            {processingAttempt === 1 && (showResults || textToFormComplete) && (
              <Card className="border-orange-200 bg-orange-50 p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 text-orange-600" />
                  <div className="flex-1">
                    <h3 className="mb-2 font-medium text-orange-900">
                      No Data Found
                    </h3>
                    <p className="mb-3 text-sm text-orange-800">
                      We couldnt extract any information from the uploaded file.
                      This may happen due to:
                    </p>
                    <ul className="mb-4 space-y-1 text-sm text-orange-800">
                      <li className="flex items-center">
                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-orange-600"></div>
                        Low image quality or poor resolution
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-orange-600"></div>
                        Blurry handwriting or unreadable text
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-orange-600"></div>
                        File not containing the expected form layout
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-1.5 w-1.5 rounded-full bg-orange-600"></div>
                        Form fields not clearly visible
                      </li>
                    </ul>
                    <p className="text-sm text-orange-800">
                      Try again with a clearer file, or enter the details
                      manually.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {audio &&
              audioToTextComplete &&
              processingAttempt > 1 &&
              !textToFormProcessing &&
              !textToFormComplete && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Review Text
                  </h3>
                  <p className="text-sm text-gray-600">
                    You can edit text below:
                  </p>
                  <Card className="p-4">
                    <div className="min-h-[200px] rounded border bg-gray-50 p-4">
                      <pre className="text-sm whitespace-pre-wrap text-gray-900">
                        {transcribedText}
                      </pre>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={handleContinueToForm}
                        className="border-0 bg-transparent p-0 text-green-600 hover:text-green-700"
                      >
                        Continue→
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
          </div>
        )}

        {textToFormProcessing && (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
            <p className="mt-2 text-sm text-gray-600">
              Processing transcribed text into form data...
            </p>
          </div>
        )}

        {isProcessing && !audioToTextComplete && (
          <div className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-b-2 border-green-600"></div>
            <p className="mt-2 text-sm text-gray-600">
              Processing your{' '}
              {audio ? 'audio recording' : text ? 'text' : 'document'}...
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          disabled={
            isProcessing ||
            textToFormProcessing ||
            (!!audio && audioToTextComplete && !textToFormComplete)
          }
          className="bg-green-600 px-8 py-2 text-white hover:bg-green-700"
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
