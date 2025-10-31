'use client';

import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Pause } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { collectorControllerSubmitDataMutation } from '@/client/@tanstack/react-query.gen';
import AiReview from './AiReview';

interface AudioRendererProps {
  workflow: {
    id: string;
    name: string;
    type: 'audio';
    maxDuration?: number;
    transcriptionEnabled?: boolean;
    languages?: string[];
  };
}

export default function AudioRenderer({ workflow }: AudioRendererProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiReviewData, setAiReviewData] = useState<any>(null);
  const [aiProcessingLogId, setAiProcessingLogId] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const submitMutation = useMutation({
    ...collectorControllerSubmitDataMutation(),
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
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          if (workflow.maxDuration && newTime >= workflow.maxDuration) {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to access microphone. Please check permissions.');
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

  const handleAiReviewComplete = (reviewData: any, processingLogId: string) => {
    setAiReviewData(reviewData);
    setAiProcessingLogId(processingLogId);
  };

  const handleReset = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setAiReviewData(null);
    setAiProcessingLogId('');
  };

  const handleSubmit = async () => {
    if (!audioBlob) return;

    setIsSubmitting(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        await submitMutation.mutateAsync({
          body: {
            workflowId: workflow.id,
            data: {
              audio: base64Audio,
              duration: recordingTime,
              transcriptionEnabled: workflow.transcriptionEnabled,
            },
            metadata: {
              type: 'audio',
              recordingTime,
            },
            aiProcessingLogId: aiProcessingLogId,
          },
        });

        alert('Audio submitted successfully!');
        window.location.href = '/user/overview';
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error('Failed to submit audio:', error);
      alert('Failed to submit audio. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
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
            {workflow.maxDuration && (
              <div className="text-sm text-gray-500">
                Max: {formatTime(workflow.maxDuration)}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 text-white hover:bg-red-700"
              >
                <Mic className="h-5 w-5" />
                Start Recording
              </button>
            )}

            {isRecording && (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-3 text-white hover:bg-gray-700"
              >
                <Square className="h-5 w-5" />
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
                  className="flex items-center gap-2 rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                    setRecordingTime(0);
                  }}
                  className="rounded bg-gray-600 px-3 py-1 text-white hover:bg-gray-700"
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

        {workflow.transcriptionEnabled && (
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              🎯 Transcription is enabled for this workflow. Your audio will be
              converted to text automatically.
            </p>
          </div>
        )}

        <AiReview 
          workflowId={workflow.id}
          formData={{ audio: audioBlob ? 'audio-data' : '', duration: recordingTime }}
          fields={[]}
          aiReviewData={aiReviewData}
          onReviewComplete={handleAiReviewComplete}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
