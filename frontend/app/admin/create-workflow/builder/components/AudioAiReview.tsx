import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerProcessAiMutation } from '@/client/@tanstack/react-query.gen';
import { toast } from 'sonner';
import { Mic, Square, X, RotateCcw } from 'lucide-react';

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
    transcription?: string;
    extracted?: Record<string, unknown>;
  } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const aiProcessMutation = useMutation({
    ...collectorControllerProcessAiMutation(),
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
      const audioBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(audioBlob);
      });

      const aiResponse = await aiProcessMutation.mutateAsync({
        body: {
          workflowId,
          processingType: 'audio',
          text: audioBase64,
        },
      });

      const responseData = aiResponse as {
        data?: {
          aiData?: {
            transcription?: string;
            extracted?: Record<string, unknown>;
          };
          aiProcessingLogId?: string;
        };
      };

      const reviewData = responseData?.data?.aiData;
      setAiReviewData(reviewData || null);

      if (reviewData) {
        toast.success('Audio processed successfully!');
        onReviewComplete?.(
          reviewData,
          responseData?.data?.aiProcessingLogId || ''
        );
        onAiTestStatusChange?.(true);
      }
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

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setAiReviewData(null);
  };

  const resetAll = () => {
    clearRecording();
    onAiTestStatusChange?.(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
        <div className="flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <Mic className="h-8 w-8 text-red-600" />
          </div>
          <div className="mb-4 font-mono text-xl font-bold text-gray-800">
            {formatTime(recordingTime)}
          </div>
          {!isRecording && !audioBlob ? (
            <button
              onClick={startRecording}
              className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            >
              <Mic className="mr-2 inline h-4 w-4" />
              Start Recording
            </button>
          ) : isRecording ? (
            <button
              onClick={stopRecording}
              className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
            >
              <Square className="mr-2 inline h-4 w-4" />
              Stop Recording
            </button>
          ) : (
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
        <div className="rounded-lg border border-gray-300 bg-white p-4">
          <div className="mb-3 flex items-start justify-between">
            <h3 className="text-lg font-semibold">AI Processing Results</h3>
            <button
              onClick={resetAll}
              className="rounded-lg bg-gray-100 px-3 py-1 text-sm text-gray-600 hover:bg-gray-200"
            >
              <RotateCcw className="mr-1 inline h-3 w-3" />
              Reset All
            </button>
          </div>
          {aiReviewData.transcription && (
            <div className="mb-4">
              <strong>Transcription:</strong>
              <div className="mt-2 rounded-lg bg-blue-50 p-3">
                <p className="text-blue-800">{aiReviewData.transcription}</p>
              </div>
            </div>
          )}
          <div>
            <strong>Extracted Data:</strong>
            <div className="mt-2 space-y-1">
              {Object.entries(aiReviewData.extracted || {}).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="font-medium">{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                )
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setAiReviewData(null);
              clearRecording();
            }}
            className="mt-4 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
