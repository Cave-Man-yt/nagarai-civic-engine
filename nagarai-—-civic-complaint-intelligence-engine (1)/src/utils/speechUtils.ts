// Speech Synthesis & Voice Narration Utility for NagarAI Multilingual Intake

export const LANGUAGE_SPEECH_MAP: Record<string, string> = {
  Tamil: 'ta-IN',
  Hindi: 'hi-IN',
  Telugu: 'te-IN',
  Kannada: 'kn-IN',
  Marathi: 'mr-IN',
  Bengali: 'bn-IN',
  Malayalam: 'ml-IN',
  Gujarati: 'gu-IN',
  Punjabi: 'pa-IN',
  English: 'en-IN',
  Tanglish: 'en-IN',
  Hinglish: 'hi-IN',
};

export const getLanguageSpeechCode = (lang?: string): string => {
  if (!lang) return 'en-IN';
  return LANGUAGE_SPEECH_MAP[lang] || 'en-IN';
};

// Store current active utterance to prevent garbage collection in certain browsers
let activeUtterance: SpeechSynthesisUtterance | null = null;

export interface SpeakOptions {
  text: string;
  language?: string;
  rate?: number;
  pitch?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
  onBoundary?: (charIndex: number) => void;
}

export const speakWording = ({
  text,
  language = 'Tamil',
  rate = 0.95,
  pitch = 1.0,
  onStart,
  onEnd,
  onError,
  onBoundary,
}: SpeakOptions): boolean => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser environment');
    if (onError) onError(new Error('SpeechSynthesis not supported'));
    return false;
  }

  try {
    // Cancel any previous in-flight speech
    window.speechSynthesis.cancel();

    if (!text || text.trim().length === 0) {
      if (onEnd) onEnd();
      return false;
    }

    const cleanText = text.trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const targetLangCode = getLanguageSpeechCode(language);
    utterance.lang = targetLangCode;
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Retrieve and pick best available voice
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      // 1. Exact match e.g. 'ta-IN', 'hi-IN'
      let matchedVoice = voices.find(
        (v) => v.lang.toLowerCase() === targetLangCode.toLowerCase()
      );

      // 2. Language prefix match e.g. 'ta', 'hi', 'te'
      if (!matchedVoice) {
        const langPrefix = targetLangCode.split('-')[0].toLowerCase();
        matchedVoice = voices.find((v) =>
          v.lang.toLowerCase().startsWith(langPrefix)
        );
      }

      // 3. Indian accent voice fallback e.g. en-IN or India voice
      if (!matchedVoice) {
        matchedVoice = voices.find(
          (v) =>
            v.lang.toLowerCase().includes('in') ||
            v.name.toLowerCase().includes('india')
        );
      }

      // 4. Any default voice
      if (!matchedVoice) {
        matchedVoice = voices.find((v) => v.default) || voices[0];
      }

      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    utterance.onstart = () => {
      if (onStart) onStart();
    };

    utterance.onend = () => {
      activeUtterance = null;
      if (onEnd) onEnd();
    };

    utterance.onerror = (e) => {
      activeUtterance = null;
      // If cancelled intentionally, ignore
      if (e.error === 'canceled' || e.error === 'interrupted') {
        if (onEnd) onEnd();
        return;
      }
      console.warn('SpeechSynthesis error:', e);
      if (onError) onError(e);
      if (onEnd) onEnd();
    };

    if (onBoundary) {
      utterance.onboundary = (e) => {
        onBoundary(e.charIndex);
      };
    }

    activeUtterance = utterance;

    // Handle paused state if any
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Error starting speech synthesis:', err);
    if (onError) onError(err);
    if (onEnd) onEnd();
    return false;
  }
};

export const stopSpeaking = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      activeUtterance = null;
    } catch (e) {
      console.warn('Error stopping speech:', e);
    }
  }
};

export const isSpeaking = (): boolean => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    return window.speechSynthesis.speaking;
  }
  return false;
};
