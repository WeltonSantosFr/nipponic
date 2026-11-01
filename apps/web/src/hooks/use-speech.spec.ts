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

    vi.stubGlobal(
      "URL",
      class MockURL {
        static createObjectURL = vi.fn(() => "blob:http://localhost/mock-audio-blob");
        static revokeObjectURL = vi.fn();
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
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeLang).toBeNull();
  });

  it("should set isLoading while audio is fetching/buffering, then transition to isPlaying once playback starts", async () => {
    // Override MockAudio so play() does NOT automatically call onplay synchronously
    let audioInstance: any;
    vi.stubGlobal(
      "Audio",
      class ManualMockAudio {
        src: string;
        playbackRate = 1.0;
        onplay: (() => void) | null = null;
        onended: (() => void) | null = null;
        onerror: ((e: any) => void) | null = null;
        play = vi.fn().mockImplementation(() => {
          // Do not call onplay yet to simulate network/buffering delay
          return Promise.resolve();
        });
        pause = vi.fn();

        constructor(src: string) {
          this.src = src;
          audioInstance = this;
        }
      }
    );

    const { result } = renderHook(() => useSpeech());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.speak("こんにちは", "ja-JP", 1.0);
    });

    // In-flight: isLoading must be true and isPlaying false
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeLang).toBe("ja-JP");

    // Audio starts playing
    act(() => {
      audioInstance.onplay?.();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPlaying).toBe(true);

    // Audio finishes
    await act(async () => {
      audioInstance.onended?.();
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
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
    const { result } = renderHook(() => useSpeech());
    const onEnd = vi.fn();

    await act(async () => {
      await result.current.speak("   ", "ja-JP", 1.0, onEnd);
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    expect(mockAudioInstances.length).toBe(0);
  });

  it("should sanitize markdown syntax before speaking", async () => {
    const { result } = renderHook(() => useSpeech());

    act(() => {
      result.current.speak("# 見出し\n**太字**と*斜体*", "ja-JP");
    });

    expect(mockAudioInstances.length).toBe(1);
    expect(mockAudioInstances[0].src).toContain(encodeURIComponent("見出し\n太字と斜体"));
  });

  it("should handle long text via POST /api/tts and play blob URL", async () => {
    const mockBlob = new Blob([new Uint8Array([1, 2, 3])], { type: "audio/mpeg" });
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(mockBlob),
    });
    vi.stubGlobal("fetch", mockFetch);

    const { result } = renderHook(() => useSpeech());
    const longText = "これはとても長い日本語のノートのテキストです。".repeat(10); // > 140 chars

    let promise: Promise<void>;
    act(() => {
      promise = result.current.speak(longText, "ja-JP");
    });

    // Wait for fetch to resolve
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockFetch).toHaveBeenCalledWith("/api/tts", expect.objectContaining({
      method: "POST",
    }));
    expect(mockAudioInstances.length).toBe(1);
    expect(mockAudioInstances[0].src).toBe("blob:http://localhost/mock-audio-blob");

    // Complete audio
    await act(async () => {
      mockAudioInstances[0].onended?.();
      await promise;
    });

    expect(result.current.isPlaying).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-audio-blob");
  });

  it("should handle audio playback error gracefully and complete", async () => {
    const { result } = renderHook(() => useSpeech());
    const onEnd = vi.fn();
    let promise: Promise<void>;

    act(() => {
      promise = result.current.speak("エラー", "ja-JP", 1.0, onEnd);
    });

    expect(result.current.isPlaying).toBe(true);

    await act(async () => {
      mockAudioInstances[0].onerror?.(new Error("Audio error"));
      await promise;
    });

    expect(onEnd).toHaveBeenCalledTimes(1);
    expect(result.current.isPlaying).toBe(false);
    expect(result.current.activeLang).toBeNull();
  });

  it("should revoke active blob URL when stop is called during long text playback", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        blob: async () => new Blob(["audio-data"], { type: "audio/mpeg" }),
      })
    );

    const { result } = renderHook(() => useSpeech());
    const longText = "これは非常に長いテキストです。".repeat(15);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.speak(longText, "ja-JP");
    });

    await act(async () => {
      await Promise.resolve(); // allow fetch to resolve and createObjectURL to be called
    });

    act(() => {
      result.current.stop();
    });

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/mock-audio-blob");
    expect(result.current.isPlaying).toBe(false);
  });

  it("should fallback to window.speechSynthesis when available and audio fails", async () => {
    const mockSpeak = vi.fn((utterance: any) => {
      utterance.onend?.();
    });
    const mockCancel = vi.fn();

    vi.stubGlobal("speechSynthesis", {
      speak: mockSpeak,
      cancel: mockCancel,
    });

    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text: string;
      lang = "";
      rate = 1.0;
      onend: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    const { result } = renderHook(() => useSpeech());
    let promise: Promise<void>;

    act(() => {
      promise = result.current.speak("フォールバックテスト", "ja-JP");
    });

    await act(async () => {
      mockAudioInstances[0].onerror?.(new Error("Audio play failed"));
      await promise;
    });

    expect(mockSpeak).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(false);
  });

  it("should immediately fallback to speechSynthesis when offline without creating Audio", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    const mockSpeak = vi.fn((utterance: any) => {
      utterance.onend?.();
    });
    vi.stubGlobal("speechSynthesis", {
      speak: mockSpeak,
      cancel: vi.fn(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text: string;
      lang = "";
      rate = 1.0;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    const { result } = renderHook(() => useSpeech());
    await act(async () => {
      await result.current.speak("オフライン", "ja-JP");
    });

    expect(mockSpeak).toHaveBeenCalled();
    expect(mockAudioInstances.length).toBe(0);
    expect(result.current.isPlaying).toBe(false);

    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  it("should fallback to speechSynthesis when audio.play() promise rejects", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSpeak = vi.fn((utterance: any) => {
      utterance.onend?.();
    });
    vi.stubGlobal("speechSynthesis", {
      speak: mockSpeak,
      cancel: vi.fn(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text: string;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    vi.stubGlobal(
      "Audio",
      class RejectingAudio {
        src: string;
        play = vi.fn().mockRejectedValue(new Error("NotAllowedError: user gesture required"));
        pause = vi.fn();
        constructor(src: string) {
          this.src = src;
        }
      }
    );

    const { result } = renderHook(() => useSpeech());

    await act(async () => {
      await result.current.speak("再生テスト", "ja-JP");
    });

    expect(mockSpeak).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "[useSpeech] audio.play() failed, trying fallback:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it("should fallback to speechSynthesis when POST /api/tts returns an error status", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSpeak = vi.fn((utterance: any) => {
      utterance.onend?.();
    });
    vi.stubGlobal("speechSynthesis", {
      speak: mockSpeak,
      cancel: vi.fn(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text: string;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    // Mock fetch for POST /api/tts
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      })
    );

    const { result } = renderHook(() => useSpeech());
    const longText = "これは非常に長いテキストです。".repeat(15); // > 140 chars

    await act(async () => {
      await result.current.speak(longText, "ja-JP");
    });

    expect(mockSpeak).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(
      "[useSpeech] POST /api/tts failed, falling back to speech synthesis:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });

  it("should fallback to speechSynthesis when POST /api/tts fetch throws network error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSpeak = vi.fn((utterance: any) => {
      utterance.onend?.();
    });
    vi.stubGlobal("speechSynthesis", {
      speak: mockSpeak,
      cancel: vi.fn(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text: string;
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Connection refused")));

    const { result } = renderHook(() => useSpeech());
    const longText = "これは非常に長いテキストです。".repeat(15);

    await act(async () => {
      await result.current.speak(longText, "ja-JP");
    });

    expect(mockSpeak).toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("should handle speech synthesis onstart and onerror events", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    let utteranceInstance: any;

    vi.stubGlobal("speechSynthesis", {
      speak: vi.fn((utterance) => {
        utteranceInstance = utterance;
      }),
      cancel: vi.fn(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text: string;
      onstart: (() => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: any) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    });

    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    const { result } = renderHook(() => useSpeech());

    let promise: Promise<void>;
    act(() => {
      promise = result.current.speak("テスト音声", "ja-JP");
    });

    // Fire onstart
    act(() => {
      utteranceInstance.onstart?.();
    });

    expect(result.current.isPlaying).toBe(true);
    expect(result.current.isLoading).toBe(false);

    // Fire onerror
    await act(async () => {
      utteranceInstance.onerror?.(new Error("Audio hardware error"));
      await promise;
    });

    expect(result.current.isPlaying).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "[useSpeech] speechSynthesis error:",
      expect.any(Error)
    );

    errorSpy.mockRestore();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  it("should handle exception when window.speechSynthesis.speak throws", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.stubGlobal("speechSynthesis", {
      speak: vi.fn(() => {
        throw new Error("Speech synthesis blocked");
      }),
      cancel: vi.fn(),
    });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      text: string;
      constructor(text: string) {
        this.text = text;
      }
    });

    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    const { result } = renderHook(() => useSpeech());

    await act(async () => {
      await result.current.speak("クラッシュテスト", "ja-JP");
    });

    expect(result.current.isPlaying).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(
      "[useSpeech] Failed to speak via speechSynthesis:",
      expect.any(Error)
    );

    errorSpy.mockRestore();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });
});
