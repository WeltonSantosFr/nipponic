"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSpeech } from "@/hooks/use-speech";
import { TokenizedText } from "@/components/tokenized-text";
import {
  Mic,
  Square,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Check,
  AlertCircle,
  Sparkles,
  Radio,
  Trash2,
} from "lucide-react";

function DynamicAudioWave({ level }: { level: number }) {
  const barScales = [
    Math.max(0.2, Math.min(1, level * 1.3 + 0.15)),
    Math.max(0.25, Math.min(1, level * 2.2 + 0.2)),
    Math.max(0.2, Math.min(1, level * 1.8 + 0.18)),
    Math.max(0.15, Math.min(1, level * 1.4 + 0.12)),
  ];

  return (
    <span className="inline-flex items-center gap-[2.5px] h-4 px-1" aria-hidden="true">
      {barScales.map((scale, i) => (
        <span
          key={i}
          className="w-[3px] bg-white rounded-full transition-transform duration-75 ease-out origin-center"
          style={{
            height: "14px",
            transform: `scaleY(${scale})`,
          }}
        />
      ))}
    </span>
  );
}

interface ShadowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  jpText: string;
  enText?: string;
}

export function ShadowingModal({
  isOpen,
  onClose,
  jpText,
  enText,
}: ShadowingModalProps) {
  // Split into sentences
  const sentencesJp = (jpText || "")
    .split(/(?<=[。！？\n])/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const sentencesEn = (enText || "")
    .split(/(?<=[.!?\n])/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [speed, setSpeed] = useState<number>(0.9);
  const [showFurigana, setShowFurigana] = useState<boolean>(true);

  // Recording states
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordDuration, setRecordDuration] = useState<number>(0);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [isPlayingUserAudio, setIsPlayingUserAudio] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const userAudioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const recordedAudioUrlRef = useRef<string | null>(null);
  const compareAbortRef = useRef<boolean>(false);

  const { speak, stop: stopNativeSpeech, isPlaying: isPlayingNative } = useSpeech();

  const currentSentenceJp = sentencesJp[currentIndex] || jpText;
  const currentSentenceEn = sentencesEn[currentIndex] || enText;

  // Stop active hardware / animation resources
  const stopHardwareStreams = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Discard user recording and reset to initial state
  const discardRecording = useCallback(() => {
    compareAbortRef.current = true;
    stopNativeSpeech();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    stopHardwareStreams();

    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      userAudioPlayerRef.current = null;
    }
    if (recordedAudioUrlRef.current) {
      URL.revokeObjectURL(recordedAudioUrlRef.current);
      recordedAudioUrlRef.current = null;
    }

    setIsRecording(false);
    setRecordedAudioUrl(null);
    setRecordDuration(0);
    setIsComparing(false);
    setIsPlayingUserAudio(false);
    setMicError(null);
  }, [stopHardwareStreams]);

  // Reset recording only when switching sentences or closing modal
  useEffect(() => {
    discardRecording();
    stopNativeSpeech();
  }, [currentIndex, isOpen, discardRecording, stopNativeSpeech]);

  const handleStartRecording = async () => {
    setMicError(null);
    stopNativeSpeech();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicError("Your browser does not support microphone audio recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Setup Web Audio Analyser for dynamic voice reactivity
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const audioCtx = new AudioContextClass();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyser.smoothingTimeConstant = 0.5;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          audioContextRef.current = audioCtx;
          analyserRef.current = analyser;

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!analyserRef.current) return;
            analyserRef.current.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i] ?? 0;
            }
            const avg = sum / dataArray.length;
            const normalized = Math.min(1, Math.max(0, avg / 75));
            setAudioLevel(normalized);
            animFrameRef.current = requestAnimationFrame(updateVolume);
          };
          animFrameRef.current = requestAnimationFrame(updateVolume);
        } catch (audioErr) {
          console.warn("Audio visualizer initialization failed:", audioErr);
        }
      }

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        recordedAudioUrlRef.current = url;
        setRecordedAudioUrl(url);
        stopHardwareStreams();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordDuration(0);

      timerRef.current = setInterval(() => {
        setRecordDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      setMicError(
        "Could not access microphone. Please check browser permissions."
      );
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  };

  const handlePlayUserRecording = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!recordedAudioUrl) {
        resolve();
        return;
      }
      stopNativeSpeech();

      if (userAudioPlayerRef.current) {
        userAudioPlayerRef.current.pause();
        userAudioPlayerRef.current = null;
      }

      const audio = new Audio(recordedAudioUrl);
      userAudioPlayerRef.current = audio;
      setIsPlayingUserAudio(true);

      let isFinished = false;
      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        setIsPlayingUserAudio(false);
        userAudioPlayerRef.current = null;
        resolve();
      };

      audio.onended = () => {
        finish();
      };

      audio.onerror = () => {
        finish();
      };

      audio.play().catch(() => {
        finish();
      });
    });
  }, [recordedAudioUrl, stopNativeSpeech]);

  const handlePauseUserRecording = () => {
    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      userAudioPlayerRef.current = null;
      setIsPlayingUserAudio(false);
    }
  };

  const handleStopCompare = useCallback(() => {
    compareAbortRef.current = true;
    stopNativeSpeech();
    if (userAudioPlayerRef.current) {
      userAudioPlayerRef.current.pause();
      userAudioPlayerRef.current = null;
    }
    setIsPlayingUserAudio(false);
    setIsComparing(false);
  }, [stopNativeSpeech]);

  // Compare mode: Play full native Japanese audio, wait for it to complete, then play full user recording
  const handleSequentialCompare = async () => {
    if (!recordedAudioUrl || !currentSentenceJp || isComparing) return;
    setIsComparing(true);
    compareAbortRef.current = false;

    try {
      // 1. Play native Japanese audio and wait until it completely finishes
      await speak(currentSentenceJp, "ja-JP", speed);

      // If comparison was stopped or cancelled, abort
      if (compareAbortRef.current) return;

      // Natural pause between native model and user voice (400ms)
      await new Promise((resolve) => setTimeout(resolve, 400));

      if (compareAbortRef.current) return;

      // 2. Play full user recording and wait until it completely finishes
      await handlePlayUserRecording();
    } catch (err) {
      console.error("Error during sequential comparison:", err);
    } finally {
      setIsComparing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl p-6 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-1 border-b pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Headphones size={20} />
              </div>
              <div>
                <DialogTitle className="text-lg">Shadowing Studio</DialogTitle>
                <DialogDescription className="text-xs">
                  Train your ears and vocal cords by listening and speaking along with native audio.
                </DialogDescription>
              </div>
            </div>

            {sentencesJp.length > 1 && (
              <Badge variant="outline" className="text-xs font-mono">
                Sentence {currentIndex + 1} of {sentencesJp.length}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-5 pt-2">
          {/* Sentence Switcher bar if multiple sentences exist */}
          {sentencesJp.length > 1 && (
            <div className="flex items-center justify-between bg-muted/40 p-1.5 rounded-lg border text-xs">
              <Button
                variant="ghost"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                <ChevronLeft size={14} />
                Previous Sentence
              </Button>

              <div className="flex items-center gap-1">
                {sentencesJp.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentIndex === i
                        ? "w-5 bg-primary rounded-full"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                disabled={currentIndex === sentencesJp.length - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                Next Sentence
                <ChevronRight size={14} />
              </Button>
            </div>
          )}

          {/* Prompt / Sentence Display Box */}
          <div className="bg-card border rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 shadow-xs relative">
            <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-primary">
                Target Sentence
              </span>
              <button
                type="button"
                onClick={() => setShowFurigana((prev) => !prev)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                  showFurigana
                    ? "bg-primary/10 border-primary/30 text-primary font-medium"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                Furigana: {showFurigana ? "ON" : "OFF"}
              </button>
            </div>

            <div className="py-2 w-full text-center">
              <TokenizedText
                text={currentSentenceJp}
                showFurigana={showFurigana}
                enContext={currentSentenceEn}
              />
            </div>

            {currentSentenceEn && (
              <p className="text-xs text-muted-foreground italic border-t border-border/40 pt-2 w-full">
                &ldquo;{currentSentenceEn}&rdquo;
              </p>
            )}
          </div>

          {/* Listening & Audio Controls */}
          <div className="flex flex-col gap-3 bg-muted/30 p-4 rounded-xl border border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <Volume2 size={14} className="text-primary" />
                <span>1. Listen to Native Audio</span>
              </span>

              {/* Speed Controls */}
              <div className="flex items-center gap-1 bg-background p-0.5 rounded-md border text-[10px] font-mono">
                {[0.75, 0.9, 1.0, 1.25].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeed(rate)}
                    className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                      speed === rate
                        ? "bg-primary text-primary-foreground font-bold shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                isPlayingNative
                  ? stopNativeSpeech()
                  : speak(currentSentenceJp, "ja-JP", speed)
              }
              className="h-11 w-full gap-2 font-semibold cursor-pointer shadow-xs"
            >
              {isPlayingNative ? (
                <>
                  <VolumeX size={18} className="text-primary animate-pulse" />
                  <span>Stop Playback</span>
                </>
              ) : (
                <>
                  <Play size={18} className="fill-current text-primary" />
                  <span>Play Native Model ({speed}x)</span>
                </>
              )}
            </Button>
          </div>

          {/* Voice Shadowing Recording Section */}
          <div className="flex flex-col gap-3 bg-muted/30 p-4 rounded-xl border border-border/60">
            <span className="text-xs font-semibold flex items-center gap-1.5">
              <Mic size={14} className="text-primary" />
              <span>2. Record Your Voice</span>
            </span>

            {micError && (
              <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{micError}</span>
              </div>
            )}

            {!recordedAudioUrl ? (
              /* Recording in progress or idle */
              <div className="flex items-center gap-3">
                {isRecording ? (
                  <Button
                    variant="destructive"
                    size="lg"
                    onClick={handleStopRecording}
                    className="flex-1 h-11 gap-2.5 cursor-pointer font-semibold shadow-xs bg-red-600 hover:bg-red-700 text-white"
                  >
                    <DynamicAudioWave level={audioLevel} />
                    <span>Stop Recording ({formatTimer(recordDuration)})</span>
                    <Square size={14} className="fill-current ml-auto opacity-80" />
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    onClick={handleStartRecording}
                    className="flex-1 h-11 gap-2 cursor-pointer font-semibold shadow-xs"
                  >
                    <Mic size={18} />
                    <span>Start Recording</span>
                  </Button>
                )}
              </div>
            ) : (
              /* Recorded state: User audio playback & Delete */
              <div className="flex flex-col gap-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between bg-card border rounded-xl p-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={isPlayingUserAudio ? handlePauseUserRecording : handlePlayUserRecording}
                      className="h-9 gap-2 text-xs font-semibold cursor-pointer border-primary/30 hover:bg-primary/10"
                    >
                      {isPlayingUserAudio ? (
                        <>
                          <Square size={13} className="fill-current text-primary" />
                          <span>Pause</span>
                        </>
                      ) : (
                        <>
                          <Play size={13} className="fill-current text-primary" />
                          <span>Play Your Recording</span>
                        </>
                      )}
                    </Button>

                    <span className="text-xs font-mono text-muted-foreground">
                      {formatTimer(recordDuration)}
                    </span>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={discardRecording}
                    className="h-9 px-2.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10 gap-1.5 cursor-pointer"
                    title="Delete recording to record again"
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </Button>
                </div>

                {/* Compare Button */}
                <Button
                  onClick={isComparing ? handleStopCompare : handleSequentialCompare}
                  disabled={(isPlayingNative && !isComparing) || (isPlayingUserAudio && !isComparing)}
                  className="w-full h-11 gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold cursor-pointer shadow-md"
                >
                  <Radio size={16} className={isComparing ? "animate-pulse text-amber-300" : ""} />
                  <span>
                    {isComparing
                      ? "Stop Comparison"
                      : "Compare: Native vs Your Voice"}
                  </span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
