'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface TextInputStepProps {
  onTextInput: (text: string) => void;
}

export function TextInputStep({ onTextInput }: TextInputStepProps) {
  const [text, setText] = useState(
    'Abeni Coker\n21\nFemale\nMy Symptoms are Headache, Body Pains,...'
  );

  const handleSubmit = () => {
    if (text.trim()) {
      onTextInput(text);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
          Write Text
        </h1>
        <p className="text-sm text-gray-600 sm:text-base">
          You can edit text below:
        </p>
      </div>

      {/* Textarea */}
      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="h-40 w-full resize-none rounded-lg border border-gray-200 p-3 focus:border-transparent focus:ring-2 focus:ring-green-500 focus:outline-none sm:h-64 sm:p-4"
          placeholder="Enter your medical information here..."
        />
      </div>

      {/* Action Button */}
      <div className="flex flex-col sm:flex-row sm:justify-end">
        <Button
          onClick={handleSubmit}
          disabled={!text.trim()}
          className="w-full rounded-lg bg-green-600 px-6 py-4 text-base font-medium text-white hover:bg-green-700 sm:w-auto sm:px-8 sm:py-6 sm:text-lg"
        >
          Continue
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
