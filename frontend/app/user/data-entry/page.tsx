'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UploadStep } from './components/upload-step';
import { TextInputStep } from './components/text-input';
import AudioRecordStep from './components/audio-input';
import { ProcessingStep } from './components/processing-step';
import { ReviewStep } from './components/review-step';
import Form from './components/form';

export type ProcessingResult = {
  success: boolean;
  data?: {
    firstName: string;
    lastName: string;
    age: string;
    gender: string;
    dateOfSymptoms: string;
    testResults: string;
    mosquitoSpecies: string;
    symptoms: string[];
  };
  error?: string;
  processingTime?: number;
  inputTokens?: number;
  outputTokens?: number;
};

export default function DataEntry() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');
  const entryId = searchParams.get('entryId');

  const [inputMode, setInputMode] = useState<
    'select' | 'upload' | 'text' | 'audio' | 'form'
  >('select');
  const [currentStep, setCurrentStep] = useState<
    'form' | 'upload' | 'text-input' | 'audio-record' | 'processing' | 'review'
  >('upload');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [formData, setFormData] = useState<ProcessingResult['data'] | null>(
    null
  );
  const [processingResult, setProcessingResult] =
    useState<ProcessingResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Case 1: user came from Overview
    if (entryId) {
      //fetch entry by ID from  backend/db
      // Simulating with fake data
      const fakeResult: ProcessingResult = {
        success: true,
        data: {
          firstName: 'John',
          lastName: 'Doe',
          age: '34',
          gender: 'Male',
          dateOfSymptoms: '2025-09-18',
          testResults: 'Positive',
          mosquitoSpecies: 'Anopheles',
          symptoms: ['fever', 'chills'],
        },
      };

      setProcessingResult(fakeResult);
      setCurrentStep('review');
      setLoading(false);
      return;
    }

    // Case 2: user opened DataEntry directly
    if (mode === 'form') {
      setInputMode('form');
      setCurrentStep('form');
    }
    if (mode === 'upload') {
      setInputMode('upload');
      setCurrentStep('upload');
    }
    if (mode === 'text') {
      setInputMode('text');
      setCurrentStep('text-input');
    }
    if (mode === 'audio') {
      setInputMode('audio');
      setCurrentStep('audio-record');
    }

    setLoading(false);
  }, [mode, entryId]);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setCurrentStep('processing');
  };

  const handleTextInput = (text: string) => {
    setTextInput(text);
    setCurrentStep('processing');
  };

  const handleAudioRecord = (blob: Blob) => {
    setAudioBlob(blob);
    setCurrentStep('processing');
  };

  const handleProcessingComplete = (result: ProcessingResult) => {
    setProcessingResult(result);
    setCurrentStep('review');
  };

  const handleReset = () => {
    setInputMode('select');
    setCurrentStep('upload');
    setUploadedFile(null);
    setTextInput('');
    setAudioBlob(null);
    setFormData(null);
    setProcessingResult(null);
  };

  const handleBack = () => {
    if (currentStep === 'processing') {
      if (inputMode === 'form') setCurrentStep('form');
      else if (inputMode === 'upload') setCurrentStep('upload');
      else if (inputMode === 'text') setCurrentStep('text-input');
      else if (inputMode === 'audio') setCurrentStep('audio-record');
    } else if (currentStep === 'review') {
      setCurrentStep('processing');
    } else {
      router.push('./overview');
    }
  };

  // ✅ Case: no entry + no mode
  if (!entryId && !mode && !loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h2 className="mb-4 text-2xl font-semibold">No Data Entry Found</h2>
        <p className="mb-6 text-gray-600">
          Please go back to the Overview page to start a new entry.
        </p>
        <button
          onClick={() => router.push('./overview')}
          className="rounded-lg bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
        >
          Go to Overview
        </button>
      </div>
    );
  }

  if (loading) {
    return <p className="py-12 text-center">Loading...</p>;
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-4xl px-4">
        {currentStep !== 'form' &&
          currentStep !== 'upload' &&
          currentStep !== 'text-input' &&
          currentStep !== 'audio-record' && (
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-2 text-gray-600 transition-colors hover:text-gray-800"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
          )}
        {currentStep === 'form' && inputMode === 'form' && <Form />}
        {currentStep === 'upload' && inputMode === 'upload' && (
          <UploadStep onFileUpload={handleFileUpload} />
        )}
        {currentStep === 'text-input' && inputMode === 'text' && (
          <TextInputStep onTextInput={handleTextInput} />
        )}
        {currentStep === 'audio-record' && inputMode === 'audio' && (
          <AudioRecordStep onAudioRecord={handleAudioRecord} />
        )}
        {currentStep === 'processing' &&
          (uploadedFile || textInput || audioBlob || formData) && (
            <ProcessingStep
              file={uploadedFile}
              text={textInput}
              audio={audioBlob}
              formData={formData}
              onProcessingComplete={handleProcessingComplete}
            />
          )}
        {currentStep === 'review' && processingResult && (
          <ReviewStep result={processingResult} onReset={handleReset} />
        )}
      </div>
    </div>
  );
}
