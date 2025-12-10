'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Mic, Square, Save, Upload } from 'lucide-react';
import { useSaveDraft } from '../hooks/useSaveDraft';
import { toast } from 'sonner';
import FormRenderer from './FormSaver';
import { useQuery } from '@tanstack/react-query';
import { workflowControllerFindWorkflowByIdOptions } from '@/client/@tanstack/react-query.gen';

interface AudioRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'audio';
    workflowConfigurations: Array<{
      type: string;
      configuration: Record<string, unknown>;
    }>;
  };
  onDataChange?: (data: string) => void;
  hideButtons?: boolean;
}

export default function AudioRenderer({
  workflow,
  onDataChange,
  hideButtons = false,
}: AudioRendererProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);

  const [recordingTime, setRecordingTime] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [audioData, setAudioData] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const { saveDraft, loadDraft, clearDraft, isSaving } = useSaveDraft({
    workflowId: workflow.id,
    type: 'audio',
  });

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.audioData && draft?.duration) {
      Promise.all(
        draft.audioData.map((data: string) =>
          fetch(data).then((res) => res.blob())
        )
      )
        .then((blobs) => {
          setAudioBlobs(blobs);
          setAudioUrls(draft.audioData);
          setRecordingTime(draft.duration);
          setAudioData(draft.audioData);
        })
        .catch(() => {});
    }
  }, [loadDraft]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        setAudioBlobs((prev) => [...prev, blob]);
        const url = URL.createObjectURL(blob);
        setAudioUrls((prev) => [...prev, url]);

        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioData((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(blob);

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast.error('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleSave = async () => {
    if (audioBlobs.length === 0 || audioData.length === 0) return;
    saveDraft({
      audioData: audioData,
      duration: recordingTime,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const audioFiles = Array.from(files).filter((f) =>
      f.type.startsWith('audio/')
    );
    if (audioFiles.length === 0) {
      toast.error('Please select valid audio files');
      return;
    }

    const MAX_SIZE = 80 * 1024 * 1024; // 80MB
    const totalSize = audioFiles.reduce((sum, file) => sum + file.size, 0);

    if (totalSize > MAX_SIZE) {
      toast.error(
        `Total file size exceeds 80MB. Current: ${(totalSize / (1024 * 1024)).toFixed(2)}MB`
      );
      return;
    }

    setAudioBlobs(audioFiles);
    const urls = audioFiles.map((file) => URL.createObjectURL(file));
    setAudioUrls(urls);

    let totalDuration = 0;
    Promise.all(
      audioFiles.map((file, idx) => {
        return new Promise<string>((resolve) => {
          const audio = new Audio(urls[idx]);
          audio.onloadedmetadata = () => {
            totalDuration += audio.duration;
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          };
        });
      })
    ).then((data) => {
      setAudioData(data);
      setRecordingTime(Math.floor(totalDuration));
    });
  };

  const handleReset = () => {
    setAudioBlobs([]);
    setAudioUrls([]);
    setRecordingTime(0);
    setShowForm(false);
    setAudioData([]);
    clearDraft();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessingComplete = () => {
    setShowForm(true);
  };

  useEffect(() => {
    if (onDataChange && audioData.length > 0) {
      onDataChange(JSON.stringify(audioData));
    }
  }, [audioData, onDataChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showForm && !hideButtons) {
    return (
      <FormRenderer
        workflowId={workflow.id}
        workflowType="audio"
        inputData={audioData}
        onProcessingComplete={handleProcessingComplete}
        language={selectedLanguage}
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[#D2DDF5] bg-white p-6">
      <div className="mb-4 flex justify-end gap-2">
        {audioBlobs.length > 0 && (
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
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <img src="/music.svg" alt="Music icon" className="h-12 w-12" />
            </div>
          </div>

          <div className="mb-4">
            <div className="font-mono text-2xl font-bold text-gray-800">
              {formatTime(recordingTime)}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording && audioBlobs.length === 0 && (
              <>
                <button
                  onClick={startRecording}
                  className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-xs text-white hover:bg-green-700 sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Mic size={16} className="sm:h-5 sm:w-5" />
                  Start Recording
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs text-white hover:bg-blue-700 sm:px-6 sm:py-3 sm:text-sm"
                >
                  <Upload size={16} className="sm:h-5 sm:w-5" />
                  Upload Audio
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-2 rounded-lg bg-gray-600 px-4 py-2 text-xs text-white hover:bg-gray-700 sm:px-6 sm:py-3 sm:text-sm"
              >
                <Square size={16} className="sm:h-5 sm:w-5" />
                Stop Recording
              </button>
            )}
          </div>
        </div>

        {audioUrls.length > 0 && (
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">
                {audioUrls.length} Audio File(s)
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className="flex items-center justify-center gap-2 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50 sm:px-3 sm:text-sm"
                >
                  <Mic size={14} className="sm:h-4 sm:w-4" />
                  Add Recording
                </button>
                <button
                  onClick={() => {
                    setAudioBlobs([]);
                    setAudioUrls([]);
                    setRecordingTime(0);
                    setAudioData([]);
                  }}
                  className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700 sm:px-3 sm:text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {audioUrls.map((url, idx) => (
                <audio key={idx} src={url} className="w-full" controls />
              ))}
            </div>
          </div>
        )}

        {!hideButtons && (
          <FormRenderer
            workflowId={workflow.id}
            workflowType="audio"
            inputData={audioData}
            onProcessingComplete={handleProcessingComplete}
            language={selectedLanguage}
          />
        )}
      </div>
    </div>
  );
}
