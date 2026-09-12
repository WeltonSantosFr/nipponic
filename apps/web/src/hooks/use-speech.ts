import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechLang } from "@nipponic/shared";

export type { SpeechLang };

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolveCurrentRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (resolveCurrentRef.current) {
      resolveCurrentRef.current();
      resolveCurrentRef.current = null;
    }
    setIsPlaying(false);
    setActiveLang(null);
  }, []);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  const speak = useCallback(
    (text: string, lang: SpeechLang, rate = 1.0, onEnd?: () => void): Promise<void> => {
      return new Promise((resolve) => {
        console.log(`[useSpeech] Playing [${lang}]:`, text);

        if (!text || !text.trim()) {
          console.warn("[useSpeech] Text is empty, skipping.");
          onEnd?.();
          resolve();
          return;
        }

        // Stop any current playback
        stop();

        const langCode = lang.startsWith("ja") ? "ja" : "en";
        const audioUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${langCode}`;

        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.playbackRate = rate;

        let isCompleted = false;
        const complete = () => {
          if (isCompleted) return;
          isCompleted = true;
          setIsPlaying(false);
          setActiveLang(null);
          audioRef.current = null;
          resolveCurrentRef.current = null;
          onEnd?.();
          resolve();
        };

        resolveCurrentRef.current = complete;

        setIsPlaying(true);
        setActiveLang(lang);

        audio.onplay = () => {
          setIsPlaying(true);
          setActiveLang(lang);
        };

        audio.onended = () => {
          console.log(`[useSpeech] Finished playing [${lang}]`);
          complete();
        };

        audio.onerror = (e) => {
          console.error("[useSpeech] Audio playback error:", e);
          complete();
        };

        audio.play().catch((err) => {
          console.error("[useSpeech] audio.play() failed:", err);
          complete();
        });
      });
    },
    [stop]
  );

  return { speak, stop, isPlaying, activeLang };
}


