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
}

export default function AudioAiReview({
  workflowId,
  onReviewComplete,
  onAiTestStatusChange,
}: AudioAiReviewProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
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
    if (!audioBlob) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('workflowId', workflowId);
      formData.append('processingType', 'audio');
      formData.append('files', audioBlob, 'audio.wav');

      const aiResponse = await aiProcessMutation.mutateAsync({ formData });

      setAiReviewData(aiResponse);
      toast.success('Audio processed successfully!');
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
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setRecordingTime(Math.floor(file.size / 16000)); // Rough estimate
    } else {
      toast.error('Please select a valid audio file');
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
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
          <div className="flex justify-center gap-4">
            {!isRecording && !audioBlob && (
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

          {audioBlob && (
            <div className="space-y-2">
              <div className="text-green-600">
                ✓ Audio recorded ({recordingTime}s)
              </div>
              {audioUrl && (
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  controls
                  className="w-full"
                />
              )}
              <div className="mt-3 flex justify-center gap-2">
                <button
                  onClick={startRecording}
                  className="rounded-lg bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  <Mic className="mr-1 inline h-3 w-3" />
                  Re-record
                </button>
                <button
                  onClick={clearRecording}
                  className="rounded-lg bg-gray-600 px-3 py-1 text-sm text-white hover:bg-gray-700"
                >
                  <X className="mr-1 inline h-3 w-3" />
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {audioBlob && !aiReviewData && (
        <button
          onClick={handleProcess}
          disabled={isProcessing}
          className="w-full rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing Audio...' : 'Process with AI'}
        </button>
      )}

      {aiReviewData && (
        <AiResponseDisplay responseData={aiReviewData} onReset={resetAll} />
      )}
    </div>
  );
}
