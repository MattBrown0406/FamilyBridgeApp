import { Capacitor } from '@capacitor/core';

export interface SpeechRecognitionUpdate {
  committedText: string;
  displayText: string;
}

export interface ActiveSpeechRecognitionSession {
  stop: () => Promise<void>;
}

interface StartLiveSpeechRecognitionOptions {
  language?: string;
  onUpdate: (update: SpeechRecognitionUpdate) => void;
  onError?: (message: string) => void;
  onListeningChange?: (listening: boolean) => void;
}

const appendSegment = (base: string, segment: string) => {
  const cleanBase = base.trim();
  const cleanSegment = segment.trim();

  if (!cleanSegment) return cleanBase;
  if (!cleanBase) return cleanSegment;
  return `${cleanBase} ${cleanSegment}`.trim();
};

const formatDisplayText = (committedText: string, interimText = '') => {
  const cleanCommitted = committedText.trim();
  const cleanInterim = interimText.trim();

  if (!cleanInterim) return cleanCommitted;
  if (!cleanCommitted) return `[listening...] ${cleanInterim}`;
  return `${cleanCommitted} [listening...] ${cleanInterim}`.trim();
};

export async function startLiveSpeechRecognition({
  language = 'en-US',
  onUpdate,
  onError,
  onListeningChange,
}: StartLiveSpeechRecognitionOptions): Promise<ActiveSpeechRecognitionSession> {
  if (Capacitor.isNativePlatform()) {
    const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');

    const availability = await SpeechRecognition.available();
    if (!availability.available) {
      throw new Error('Speech recognition is not available on this device.');
    }

    const permissions = await SpeechRecognition.checkPermissions();
    if (permissions.speechRecognition !== 'granted') {
      const requested = await SpeechRecognition.requestPermissions();
      if (requested.speechRecognition !== 'granted') {
        throw new Error('Microphone and speech recognition permission are required.');
      }
    }

    let active = true;
    let committedText = '';
    let currentSegment = '';

    const pushUpdate = () => {
      onUpdate({
        committedText,
        displayText: formatDisplayText(committedText, currentSegment),
      });
    };

    const restartNativeRecognition = async () => {
      if (!active) return;
      await SpeechRecognition.start({
        language,
        maxResults: 1,
        partialResults: true,
        popup: false,
      });
    };

    await SpeechRecognition.removeAllListeners();

    await SpeechRecognition.addListener('partialResults', ({ matches }) => {
      currentSegment = matches?.[0]?.trim() || '';
      pushUpdate();
    });

    await SpeechRecognition.addListener('listeningState', async ({ status }) => {
      if (status === 'started') {
        onListeningChange?.(true);
        return;
      }

      if (currentSegment) {
        committedText = appendSegment(committedText, currentSegment);
        currentSegment = '';
        pushUpdate();
      }

      if (!active) {
        onListeningChange?.(false);
        return;
      }

      try {
        await restartNativeRecognition();
      } catch (error) {
        active = false;
        onListeningChange?.(false);
        onError?.(error instanceof Error ? error.message : 'Speech recognition stopped unexpectedly.');
      }
    });

    try {
      await restartNativeRecognition();
      onListeningChange?.(true);
    } catch (error) {
      await SpeechRecognition.removeAllListeners();
      throw error;
    }

    return {
      stop: async () => {
        active = false;

        if (currentSegment) {
          committedText = appendSegment(committedText, currentSegment);
          currentSegment = '';
        }

        try {
          await SpeechRecognition.stop();
        } finally {
          await SpeechRecognition.removeAllListeners();
          onUpdate({ committedText, displayText: committedText });
          onListeningChange?.(false);
        }
      },
    };
  }

  const SpeechRecognitionApi = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SpeechRecognitionApi) {
    throw new Error('Speech recognition is not supported in this browser. Please use Chrome, Edge, or the iPhone app.');
  }

  let active = true;
  let committedText = '';
  const recognition = new SpeechRecognitionApi();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = language;

  recognition.onresult = (event: any) => {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript.trim()) {
      committedText = appendSegment(committedText, finalTranscript);
    }

    onUpdate({
      committedText,
      displayText: formatDisplayText(committedText, interimTranscript),
    });
  };

  recognition.onerror = (event: any) => {
    if (event.error !== 'no-speech') {
      onError?.(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    if (active) {
      recognition.start();
      return;
    }

    onListeningChange?.(false);
  };

  recognition.start();
  onListeningChange?.(true);

  return {
    stop: async () => {
      active = false;
      recognition.stop();
      onUpdate({ committedText, displayText: committedText });
      onListeningChange?.(false);
    },
  };
}
