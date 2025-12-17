import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Mic, Square, X, Upload } from 'lucide-react';
import { useAuthStore } from '@/app/store/use-auth-store';
import AiResponseDisplay from '../field-mapping/components/AiResponseDisplay';

interface AudioAiReviewProps {
  workflowId: string;
  onReviewComplete?: (reviewData: unknown, logId: string) => void;
  onAiTestStatusChange?: (hasCompleted: boolean) => void;
  supportedLanguages?: string[];
}

export default function AudioAiReview({
  workflowId,
  onReviewComplete,
  onAiTestStatusChange,
  supportedLanguages = ['English'],
}: AudioAiReviewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>(
    supportedLanguages[0] || 'English'
  );

  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiReviewData, setAiReviewData] = useState<{
    success: boolean;
    data?: {
      aiData?: {
        form_id?: string;
        extracted?: Record<string, unknown>;
        confidence?: Record<string, number>;
        spans?: Record<string, unknown>;
        missing_required?: string[];
      };
      metrics?: {
        asr_seconds?: number;
        vision_seconds?: number;
        llm_seconds?: number;
        total_seconds?: number;
        tokens_in?: number;
        tokens_out?: number;
        cost_usd?: number;
        model?: string;
        provider?: string;
      };
      aiProcessingLogId?: string;
    };
    timestamp?: string;
    error?: string;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { auth } = useAuthStore();

  const aiProcessMutation = useMutation({
    mutationFn: async ({ formData }: { formData: FormData }) => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/collector/process-ai`,
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${auth?.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
  });

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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Failed to access microphone');
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

  const handleProcess = async () => {
    if (audioBlobs.length === 0) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('workflowId', workflowId);
      formData.append('processingType', 'audio');
      formData.append('language', selectedLanguage);
      audioBlobs.forEach((blob, idx) =>
        formData.append('files', blob, `audio-${idx}.wav`)
      );

      const aiResponse = await aiProcessMutation.mutateAsync({ formData });

      setAiReviewData(aiResponse);
      toast.success(
        `${audioBlobs.length} audio file(s) processed successfully!`
      );
      onReviewComplete?.(aiResponse, aiResponse?.data?.aiProcessingLogId || '');
      onAiTestStatusChange?.(true);
    } catch {
      toast.error('Failed to process audio');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

    // Get total duration
    let totalDuration = 0;
    audioFiles.forEach((file, idx) => {
      const audio = new Audio(urls[idx]);
      audio.onloadedmetadata = () => {
        totalDuration += audio.duration;
        if (idx === audioFiles.length - 1) {
          setRecordingTime(Math.floor(totalDuration));
        }
      };
    });
  };

  const clearRecording = () => {
    setAudioBlobs([]);
    setAudioUrls([]);
    setRecordingTime(0);
    setAiReviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetAll = () => {
    clearRecording();
    onAiTestStatusChange?.(false);
  };

  return (
    <div className="space-y-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Test Audio Processing
        </h3>
        {supportedLanguages.length === 1 ? (
          <div className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-green-600 sm:px-4 sm:text-sm">
            {supportedLanguages[0]}
          </div>
        ) : (
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
        )}
      </div>
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="flex flex-col items-center">
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
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
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

          {audioBlobs.length > 0 && (
            <div className="space-y-2">
              <div className="text-green-600">
                ✓ {audioBlobs.length} audio file(s) ({recordingTime}s total)
              </div>
              <div className="space-y-2">
                {audioUrls.map((url, idx) => (
                  <audio key={idx} src={url} controls className="w-full" />
                ))}
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={startRecording}
                  disabled={isRecording}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Mic className="mr-1 inline h-3 w-3" />
                  Add Recording
                </button>
                <button
                  onClick={clearRecording}
                  className="rounded-lg bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
                >
                  <X className="mr-1 inline h-3 w-3" />
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {audioBlobs.length > 0 && !aiReviewData && (
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isProcessing
            ? `Processing ${audioBlobs.length} Audio File(s)...`
            : `Process ${audioBlobs.length} Audio File(s) with AI`}
        </button>
      )}

      {aiReviewData && (
        <AiResponseDisplay responseData={aiReviewData} onReset={resetAll} />
      )}
    </div>
  );
}
