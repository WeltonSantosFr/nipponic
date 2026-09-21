import { useCallback, useEffect, useRef, useState } from "react";
import type { SpeechLang } from "@nipponic/shared";

export type { SpeechLang };

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[#>\s*+-]+/gm, "")
    .replace(/[*_~]/g, "")
    .trim();
}

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);
  const resolveCurrentRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
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
        const cleanText = cleanTextForSpeech(text || "");

        if (!cleanText) {
          console.warn("[useSpeech] Text is empty after sanitization, skipping.");
          onEnd?.();
          resolve();
          return;
        }

        // Stop any current playback
        stop();

        const langCode = lang.startsWith("ja") ? "ja" : "en";
        let isCompleted = false;

        const complete = () => {
          if (isCompleted) return;
          isCompleted = true;
          if (activeBlobUrlRef.current) {
            URL.revokeObjectURL(activeBlobUrlRef.current);
            activeBlobUrlRef.current = null;
          }
          audioRef.current = null;
          resolveCurrentRef.current = null;
          setIsPlaying(false);
          setActiveLang(null);
          onEnd?.();
          resolve();
        };

        resolveCurrentRef.current = complete;
        setIsPlaying(true);
        setActiveLang(lang);

        const fallbackToSpeechSynthesis = () => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            try {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(cleanText);
              utterance.lang = langCode === "ja" ? "ja-JP" : "en-US";
              utterance.rate = rate;
              utterance.onend = () => {
                complete();
              };
              utterance.onerror = (err) => {
                console.error("[useSpeech] speechSynthesis error:", err);
                complete();
              };
              window.speechSynthesis.speak(utterance);
              return;
            } catch (synthErr) {
              console.error("[useSpeech] Failed to speak via speechSynthesis:", synthErr);
            }
          }
          complete();
        };

        const playAudioUrl = (url: string) => {
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.playbackRate = rate;

          audio.onplay = () => {
            setIsPlaying(true);
            setActiveLang(lang);
          };

          audio.onended = () => {
            complete();
          };

          audio.onerror = (e) => {
            console.error("[useSpeech] Audio playback error, trying fallback:", e);
            fallbackToSpeechSynthesis();
          };

          audio.play().catch((err) => {
            console.error("[useSpeech] audio.play() failed, trying fallback:", err);
            fallbackToSpeechSynthesis();
          });
        };

        // For short text, use standard GET request directly
        if (cleanText.length <= 140) {
          const audioUrl = `/api/tts?text=${encodeURIComponent(cleanText)}&lang=${langCode}`;
          playAudioUrl(audioUrl);
          return;
        }

        // For longer text (notes, paragraphs), use POST to bypass URL length limits
        fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: cleanText, lang: langCode }),
        })
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`TTS server responded with status ${response.status}`);
            }
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            activeBlobUrlRef.current = blobUrl;
            playAudioUrl(blobUrl);
          })
          .catch((fetchErr) => {
            console.error("[useSpeech] POST /api/tts failed, falling back to speech synthesis:", fetchErr);
            fallbackToSpeechSynthesis();
          });
      });
    },
    [stop]
  );

  return { speak, stop, isPlaying, activeLang };
}
