import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Volume2 } from 'lucide-react';

interface AudioTranscriberProps {
  onTranscriptionChange?: (transcription: string) => void;
  language?: string;
}

// Type definitions for Speech Recognition API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition: {
      new (): SpeechRecognition;
    };
  }
}

export default function AudioTranscriber({
  onTranscriptionChange,
  language = 'en-US',
}: AudioTranscriberProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition() as SpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    let currentTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      currentTranscript += finalTranscript;
      const fullTranscript = currentTranscript + interimTranscript;
      setTranscription(fullTranscript);
      onTranscriptionChange?.(fullTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, [language, onTranscriptionChange]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        setTranscription('');
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Failed to stop recognition:', error);
      }
      setIsListening(false);
    }
  };

  const clearTranscription = () => {
    setTranscription('');
    onTranscriptionChange?.('');
  };

  if (!isSupported) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm text-red-600">
          Speech recognition is not supported in this browser. Please use
          Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center">
        <div className="flex flex-col items-center">
          <div
            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
              isListening ? 'animate-pulse bg-red-100' : 'bg-gray-100'
            }`}
          >
            {isListening ? (
              <Volume2 className="h-8 w-8 text-red-600" />
            ) : (
              <Mic className="h-8 w-8 text-gray-600" />
            )}
          </div>

          <p className="mb-4 text-gray-600">
            {isListening
              ? 'Listening... Speak now'
              : 'Click to start voice transcription'}
          </p>

          <div className="flex gap-2">
            {!isListening ? (
              <button
                onClick={startListening}
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
              >
                <Mic className="mr-2 inline h-4 w-4" />
                Start Listening
              </button>
            ) : (
              <button
                onClick={stopListening}
                className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                <Square className="mr-2 inline h-4 w-4" />
                Stop Listening
              </button>
            )}

            {transcription && (
              <button
                onClick={clearTranscription}
                className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {transcription && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-blue-900">
            Live Transcription:
          </h4>
          <div className="max-h-32 overflow-y-auto rounded bg-white p-3">
            <p className="text-sm text-gray-800">{transcription}</p>
          </div>
        </div>
      )}
    </div>
  );
}
