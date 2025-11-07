'use client';

/**
 * Voice Input Component
 *
 * Provides voice-to-text input using Web Speech API.
 * Features:
 * - Push-to-talk or continuous listening modes
 * - Real-time transcription display
 * - Visual feedback (mic animation, status indicators)
 * - Fallback for unsupported browsers
 * - Automatic text submission to chat
 */

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  continuous?: boolean; // If true, keeps listening until stopped
  autoSubmit?: boolean; // If true, submits transcript when speech ends
  className?: string;
}

export function VoiceInput({
  onTranscript,
  onError,
  continuous = false,
  autoSubmit = false,
  className = ''
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef('');

  // Check browser support and initialize Speech Recognition
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      const errorMsg = 'Speech recognition not supported in this browser';
      setError(errorMsg);
      logger.warn('[VoiceInput] Speech recognition not supported');
      onError?.(errorMsg);
      return;
    }

    // Initialize recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = continuous;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      logger.info('[VoiceInput] Recognition started');
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          final += transcriptPart + ' ';
        } else {
          interim += transcriptPart;
        }
      }

      if (final) {
        finalTranscriptRef.current += final;
        setTranscript(finalTranscriptRef.current);
        logger.info('[VoiceInput] Final transcript', { text: final });
      }

      setInterimTranscript(interim);
    };

    recognition.onend = () => {
      logger.info('[VoiceInput] Recognition ended', { transcript: finalTranscriptRef.current });
      setIsListening(false);
      setInterimTranscript('');

      // Submit transcript if autoSubmit is enabled and we have text
      if (autoSubmit && finalTranscriptRef.current.trim()) {
        onTranscript(finalTranscriptRef.current.trim());
        setTranscript('');
        finalTranscriptRef.current = '';
      }
    };

    recognition.onerror = (event: any) => {
      logger.error('[VoiceInput] Recognition error', { error: event.error });
      setIsListening(false);

      let errorMsg = 'Voice recognition error';
      switch (event.error) {
        case 'no-speech':
          errorMsg = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMsg = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMsg = 'Microphone access denied. Please grant permission.';
          break;
        case 'network':
          errorMsg = 'Network error. Please check your connection.';
          break;
        default:
          errorMsg = `Voice recognition error: ${event.error}`;
      }

      setError(errorMsg);
      onError?.(errorMsg);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [continuous, autoSubmit, onTranscript, onError]);

  const startListening = () => {
    if (!recognitionRef.current || isListening) return;

    try {
      finalTranscriptRef.current = '';
      setTranscript('');
      setInterimTranscript('');
      setError(null);
      recognitionRef.current.start();
      logger.info('[VoiceInput] Starting recognition');
    } catch (error) {
      logger.error('[VoiceInput] Failed to start recognition', { error });
      setError('Failed to start voice recognition');
      onError?.('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.stop();
      logger.info('[VoiceInput] Stopping recognition');
    } catch (error) {
      logger.error('[VoiceInput] Failed to stop recognition', { error });
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = () => {
    if (finalTranscriptRef.current.trim()) {
      onTranscript(finalTranscriptRef.current.trim());
      setTranscript('');
      finalTranscriptRef.current = '';
    }
  };

  // If not supported, show message
  if (!isSupported) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        Voice input not supported in this browser. Please use Chrome, Edge, or Safari.
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Voice button */}
      <Button
        onClick={toggleListening}
        variant={isListening ? 'destructive' : 'default'}
        size="icon"
        className={`rounded-full transition-all ${
          isListening ? 'animate-pulse' : ''
        }`}
        title={isListening ? 'Stop listening' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>

      {/* Status indicator */}
      {isListening && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Listening...</span>
        </div>
      )}

      {/* Transcript display */}
      {(transcript || interimTranscript) && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm">
            <span className="text-foreground">{transcript}</span>
            <span className="text-muted-foreground italic">{interimTranscript}</span>
          </p>
          {!autoSubmit && transcript && (
            <Button
              onClick={handleSubmit}
              size="sm"
              className="mt-2"
            >
              Submit
            </Button>
          )}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}

/**
 * Voice Input Button - Simplified component for inline use
 */
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
  onToggle?: () => void;
  className?: string;
}

export function VoiceInputButton({
  onTranscript,
  isListening = false,
  onToggle,
  className = ''
}: VoiceInputButtonProps) {
  const [internalListening, setInternalListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
    };

    recognition.onend = () => {
      setInternalListening(false);
    };

    recognition.onerror = () => {
      setInternalListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const handleClick = () => {
    if (internalListening) {
      recognitionRef.current?.stop();
      setInternalListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setInternalListening(true);
      } catch (error) {
        logger.error('[VoiceInputButton] Failed to start', { error });
      }
    }
    onToggle?.();
  };

  const listening = onToggle ? isListening : internalListening;

  return (
    <Button
      onClick={handleClick}
      variant="ghost"
      size="icon"
      className={`${className} ${listening ? 'text-destructive' : ''}`}
      title={listening ? 'Stop listening' : 'Start voice input'}
    >
      {listening ? (
        <MicOff className="h-5 w-5 animate-pulse" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </Button>
  );
}
