'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Save } from 'lucide-react';
import { useSaveDraft } from '../hooks/useSaveDraft';
import FormRenderer from './FormSaver';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';

interface TextRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'text';
    workflowConfigurations: Array<{
      type: string;
      configuration: Record<string, unknown>;
    }>;
  };
  onDataChange?: (data: string) => void;
  hideButtons?: boolean;
}

export default function TextRenderer({
  workflow,
  onDataChange,
  hideButtons = false,
}: TextRendererProps) {
  const [textInput, setTextInput] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const { saveDraft, loadDraft, clearDraft, isSaving } = useSaveDraft({
    workflowId: workflow.id,
    type: 'text',
  });

  const { data: workflowData } = useQuery({
    ...workflowControllerFindWorkflowByIdOptions({
      path: { workflowId: workflow.id },
    }),
  });

  const supportedLanguages = useMemo(
    () =>
      (workflowData as { data?: { supportedLanguages?: string[] } })?.data
        ?.supportedLanguages || [],
    [workflowData]
  );

  useEffect(() => {
    if (supportedLanguages.length > 0 && !selectedLanguage) {
      setSelectedLanguage(supportedLanguages[0]);
    }
  }, [supportedLanguages, selectedLanguage]);

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.text) {
      setTextInput(draft.text);
    }
  }, [loadDraft]);

  const handleSave = () => {
    if (!textInput.trim()) return;
    saveDraft({ text: textInput });
  };

  const handleReset = () => {
    setTextInput('');
    setShowForm(false);
    clearDraft();
  };

  const handleProcessingComplete = () => {
    setShowForm(true);
  };

  useEffect(() => {
    if (onDataChange) {
      onDataChange(textInput);
    }
  }, [textInput, onDataChange]);

  if (showForm && !hideButtons) {
    return (
      <FormRenderer
        workflowId={workflow.id}
        workflowType="text"
        inputData={textInput}
        onProcessingComplete={handleProcessingComplete}
        language={selectedLanguage}
      />
    );
  }

  return (
    <div className="rounded-lg border border-[#D2DDF5] bg-white p-6">
      <div className="mb-4 flex justify-end gap-2">
        {textInput.trim() && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs text-white hover:bg-blue-700 disabled:opacity-50 sm:px-4 sm:text-sm"
          >
            <Save size={14} className="sm:h-4 sm:w-4" />
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        )}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 sm:px-4 sm:text-sm"
        >
          Reset
        </button>
        {supportedLanguages.length === 1 ? (
          <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-green-600 sm:px-4 sm:text-sm">
            {supportedLanguages[0]}
          </div>
        ) : supportedLanguages.length > 1 ? (
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-green-600 hover:bg-gray-50 focus:ring-2 focus:ring-green-500 sm:px-4 sm:text-sm"
          >
            {supportedLanguages.map((lang) => (
              <option
                key={lang}
                value={lang}
                className="bg-white text-gray-900"
              >
                {lang}
              </option>
            ))}
          </select>
        ) : null}
      </div>
      <div className="space-y-6">
        <div>
          <label className="text-md mb-2 block font-medium text-gray-700">
            Write Text:
          </label>
          <textarea
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            rows={6}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:outline-none"
            placeholder="Type your text here..."
          />
        </div>

        {!hideButtons && textInput.trim() && (
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => (window.location.href = '/user/overview')}
              className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleProcessingComplete}
              className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
            >
              Process with AI
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
