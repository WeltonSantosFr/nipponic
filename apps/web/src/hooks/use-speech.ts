import { useCallback, useEffect, useRef, useState } from "react";

export function useSpeech() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
    setActiveLang(null);
  }, []);

  const speak = useCallback(
    (text: string, lang: "en-US" | "ja-JP", rate = 1.0) => {
      console.log(`[useSpeech] Playing [${lang}]:`, text);

      if (!text || !text.trim()) {
        console.warn("[useSpeech] Text is empty, skipping.");
        return;
      }

      // Stop any current playback
      stop();

      const langCode = lang.startsWith("ja") ? "ja" : "en";
      const audioUrl = `/api/tts?text=${encodeURIComponent(text.trim())}&lang=${langCode}`;

      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.playbackRate = rate;

      setIsPlaying(true);
      setActiveLang(lang);

      audio.onplay = () => {
        setIsPlaying(true);
        setActiveLang(lang);
      };

      audio.onended = () => {
        console.log(`[useSpeech] Finished playing [${lang}]`);
        setIsPlaying(false);
        setActiveLang(null);
        audioRef.current = null;
      };

      audio.onerror = (e) => {
        console.error("[useSpeech] Audio playback error:", e);
        setIsPlaying(false);
        setActiveLang(null);
        audioRef.current = null;
      };

      audio.play().catch((err) => {
        console.error("[useSpeech] audio.play() failed:", err);
        setIsPlaying(false);
        setActiveLang(null);
        audioRef.current = null;
      });
    },
    [stop]
  );

  return { speak, stop, isPlaying, activeLang };
}


