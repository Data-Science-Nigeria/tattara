'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Save } from 'lucide-react';
import { useSaveDraft } from '../hooks/useSaveDraft';
import { toast } from 'sonner';
import FormRenderer from './FormRenderer';

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
}

export default function AudioRenderer({ workflow }: AudioRendererProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [audioData, setAudioData] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const { saveDraft, loadDraft, clearDraft, isSaving } = useSaveDraft({
    workflowId: workflow.id,
    type: 'audio',
  });

  useEffect(() => {
    const draft = loadDraft();
    if (draft?.audioData && draft?.duration) {
      fetch(draft.audioData)
        .then((res) => res.blob())
        .then((blob) => {
          setAudioBlob(blob);
          setAudioUrl(draft.audioData);
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
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert to base64 for AI processing
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioData(reader.result as string);
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

  const playAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSave = async () => {
    if (!audioBlob || !audioData) return;
    saveDraft({
      audioData: audioData,
      duration: recordingTime,
    });
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setShowForm(false);
    setAudioData('');
    clearDraft();
  };

  const handleProcessingComplete = () => {
    setShowForm(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (showForm) {
    return (
      <FormRenderer
        workflowId={workflow.id}
        workflowType="audio"
        inputData={audioData}
        onProcessingComplete={handleProcessingComplete}
      />
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex justify-end gap-2">
        {audioBlob && (
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
      </div>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
              <Mic className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="mb-4">
            <div className="font-mono text-2xl font-bold text-gray-800">
              {formatTime(recordingTime)}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs text-white hover:bg-red-700 sm:px-6 sm:py-3 sm:text-sm"
              >
                <Mic size={16} className="sm:h-5 sm:w-5" />
                Start Recording
              </button>
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

        {audioUrl && (
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Recording Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={isPlaying ? pauseAudio : playAudio}
                  className="flex items-center justify-center gap-2 rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 sm:px-3 sm:text-sm"
                >
                  {isPlaying ? (
                    <Pause size={14} className="sm:h-4 sm:w-4" />
                  ) : (
                    <Play size={14} className="sm:h-4 sm:w-4" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                    setRecordingTime(0);
                    setAudioData('');
                  }}
                  className="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-700 sm:px-3 sm:text-sm"
                >
                  Re-record
                </button>
              </div>
            </div>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
          </div>
        )}

        <FormRenderer
          workflowId={workflow.id}
          workflowType="audio"
          inputData={audioData}
          onProcessingComplete={handleProcessingComplete}
        />
      </div>
    </div>
  );
}
