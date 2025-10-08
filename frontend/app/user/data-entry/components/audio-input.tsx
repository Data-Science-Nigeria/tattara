'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface AudioRecordStepProps {
  onAudioRecord?: (blob: Blob) => void;
}

export default function AudioRecordStep({
  onAudioRecord,
}: AudioRecordStepProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        if (onAudioRecord) {
          onAudioRecord(blob);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-4xl space-y-6 sm:space-y-8">
        <h1 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
          Record Audio
        </h1>
        <Card>
          <CardContent className="p-4 sm:p-6">
            {
              <div className="items-center justify-center py-6 text-center sm:py-8">
                <button onClick={isRecording ? stopRecording : startRecording}>
                  {isRecording ? (
                    <div className="flex items-center justify-center gap-2 text-base text-[#008647] sm:text-lg">
                      <img
                        src={'/microphone-2.svg'}
                        alt="microphone"
                        className="h-5 w-5 sm:h-6 sm:w-6"
                      />
                      <span>Recording...</span>
                    </div>
                  ) : (
                    <img
                      src={'/record.svg'}
                      alt="Start recording"
                      className="h-16 w-16 sm:h-20 sm:w-20"
                    />
                  )}
                </button>

                <h1 className="mt-4 items-center text-gray-600">
                  {isRecording ? (
                    <div className="flex items-center justify-center gap-2 text-xl sm:text-2xl">
                      <span>{formatTime(recordingTime)}</span>
                      <button onClick={stopRecording}>
                        <img
                          src={'/stop-circle.svg'}
                          alt="Stop recording"
                          className="h-6 w-6 sm:h-8 sm:w-8"
                        />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 text-base text-[#008647] sm:text-lg">
                      <img
                        src={'/microphone-2.svg'}
                        alt="microphone"
                        className="h-5 w-5 sm:h-6 sm:w-6"
                      />
                      <span>Start Recording...</span>
                    </div>
                  )}
                </h1>
                <p
                  className={`${
                    isRecording
                      ? 'mt-4 text-base text-red-700 sm:text-lg'
                      : 'text-sm sm:text-base'
                  }`}
                >
                  {isRecording
                    ? 'Cancel Recording...'
                    : 'Click the button above to start recording your voice.'}
                </p>
              </div>
            }
            <audio ref={audioRef} className="hidden" />
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 flex justify-end">
        <Button
          className="w-full bg-green-600 text-white hover:bg-green-700 sm:w-auto"
          onClick={() => {
            const blob = (window as Window & { recordedAudioBlob?: Blob })
              .recordedAudioBlob;
            if (blob && onAudioRecord) {
              onAudioRecord(blob);
            }
          }}
        >
          Next →
        </Button>
      </div>
    </div>
  );
}
