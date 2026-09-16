import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSpeech } from "./use-speech";

describe("useSpeech hook", () => {
  let mockAudioInstances: any[] = [];

  beforeEach(() => {
    mockAudioInstances = [];

    vi.stubGlobal(
      "Audio",
      class MockAudio {
        src: string;
        playbackRate = 1.0;
        onplay: (() => void) | null = null;
        onended: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        play = vi.fn().mockImplementation(() => {
          this.onplay?.();
          return Promise.resolve();
        });
        pause = vi.fn();

        constructor(src: string) {
          this.src = src;
          mockAudioInstances.push(this);
        }
      }
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should initialize with default states", () => {
    const { result } = renderHook(() => useSpeech());
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeLang).toBeNull();
  });

  it("should play audio and resolve Promise when onended triggers", async () => {
    const { result } = renderHook(() => useSpeech());

    let speakFinished = false;
    let promise: Promise<void>;

    act(() => {
      promise = result.current.speak("こんにちは", "ja-JP", 1.0).then(() => {
        speakFinished = true;
      });
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.activeLang).toBe("ja-JP");
    expect(mockAudioInstances.length).toBe(1);
    expect(mockAudioInstances[0].src).toContain("/api/tts?text=%E3%81%93%E3%82%93%E3%81%AB%E3%81%A1%E3%81%AF&lang=ja");
    expect(speakFinished).toBe(false);

    // Simulate audio finished
    await act(async () => {
      mockAudioInstances[0].onended?.();
      await promise;
    });

    expect(speakFinished).toBe(true);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeLang).toBeNull();
  });

  it("should resolve Promise immediately when stop() is called", async () => {
    const { result } = renderHook(() => useSpeech());

    let speakFinished = false;
    let promise: Promise<void>;

    act(() => {
      promise = result.current.speak("Hello", "en-US").then(() => {
        speakFinished = true;
      });
    });

    expect(result.current.isPlaying).toBe(true);
    expect(speakFinished).toBe(false);

    await act(async () => {
      result.current.stop();
      await promise;
    });

    expect(speakFinished).toBe(true);
    expect(result.current.isPlaying).toBe(false);
  });

  it("should resolve immediately and call onEnd when text is empty or whitespace", async () => {
    // Arrange
    const { result } = renderHook(() => useSpeech());
    const onEnd = vi.fn();

    // Act
    await act(async () => {
      await result.current.speak("   ", "ja-JP", 1.0, onEnd);
    });

    // Assert
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    expect(mockAudioInstances.length).toBe(0);
  });

  it("should handle audio playback error gracefully and complete", async () => {
    // Arrange
    const { result } = renderHook(() => useSpeech());
    const onEnd = vi.fn();
    let promise: Promise<void>;

    // Act
    act(() => {
      promise = result.current.speak("エラー", "ja-JP", 1.0, onEnd);
    });

    expect(result.current.isPlaying).toBe(true);

    await act(async () => {
      mockAudioInstances[0].onerror?.(new Error("Audio error"));
      await promise;
    });

    // Assert
    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeLang).toBeNull();
  });
});


