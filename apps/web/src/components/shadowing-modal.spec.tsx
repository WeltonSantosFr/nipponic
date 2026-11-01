import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShadowingModal } from "./shadowing-modal";
import * as speechModule from "@/hooks/use-speech";

// Mock TokenizedText
vi.mock("@/components/tokenized-text", () => ({
  TokenizedText: ({ text, showFurigana }: any) => (
    <div data-testid="mock-tokenized-text">
      <span>{text}</span>
      <span>Furigana: {showFurigana ? "ON" : "OFF"}</span>
    </div>
  ),
}));

class MockMediaRecorder {
  state = "inactive";
  ondataavailable: ((e: any) => void) | null = null;
  onstop: (() => void) | null = null;
  start = vi.fn().mockImplementation(() => {
    this.state = "recording";
  });
  stop = vi.fn().mockImplementation(() => {
    this.state = "inactive";
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(["dummy audio"], { type: "audio/webm" }) });
    }
    if (this.onstop) {
      this.onstop();
    }
  });
}

class MockAudio {
  src = "";
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  static autoEnd = true;
  static playReject = false;
  static triggerError = false;
  constructor(src?: string) {
    this.src = src || "";
  }
  play = vi.fn().mockImplementation(function (this: MockAudio) {
    if (MockAudio.playReject) {
      return Promise.reject(new Error("Play failed"));
    }
    if (MockAudio.triggerError) {
      setTimeout(() => {
        this.onerror?.();
      }, 10);
      return Promise.resolve();
    }
    if (MockAudio.autoEnd) {
      setTimeout(() => {
        this.onended?.();
      }, 10);
    }
    return Promise.resolve();
  });
  pause = vi.fn().mockImplementation(function (this: MockAudio) {
    this.onended?.();
  });
}

describe("ShadowingModal", () => {
  const mockSpeak = vi.fn().mockResolvedValue(undefined);
  const mockStop = vi.fn();
  let mockIsPlaying = false;

  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPlaying = false;
    MockAudio.autoEnd = true;
    MockAudio.playReject = false;
    MockAudio.triggerError = false;

    vi.spyOn(speechModule, "useSpeech").mockImplementation(() => ({
      speak: mockSpeak,
      stop: mockStop,
      isPlaying: mockIsPlaying,
      isLoading: false,
      supported: true,
      voices: [],
    } as any));

    // Setup Audio & URL mocks
    (window as any).Audio = MockAudio;
    window.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-audio");
    window.URL.revokeObjectURL = vi.fn();

    // Setup Web Audio Analyser mock
    const mockAnalyser = {
      fftSize: 0,
      smoothingTimeConstant: 0,
      frequencyBinCount: 32,
      getByteFrequencyData: vi.fn((arr: Uint8Array) => arr.fill(50)),
      connect: vi.fn(),
    };
    class MockAudioContext {
      createAnalyser = vi.fn(() => mockAnalyser);
      createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
      close = vi.fn().mockResolvedValue(undefined);
    }
    (window as any).AudioContext = MockAudioContext;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb: FrameRequestCallback) => {
      return setTimeout(() => cb(100), 16) as any;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id: number) => {
      clearTimeout(id);
    });

    // Setup MediaDevices & MediaRecorder
    (window as any).MediaRecorder = MockMediaRecorder;
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: vi.fn() }],
        }),
      },
    });
  });

  it("renders modal when open and handles close", () => {
    const handleClose = vi.fn();
    const { rerender } = render(
      <ShadowingModal
        isOpen={true}
        onClose={handleClose}
        jpText="こんにちは。元気ですか？"
        enText="Hello. How are you?"
      />
    );

    expect(screen.getByText("Shadowing Studio")).toBeInTheDocument();
    expect(screen.getByText("こんにちは。")).toBeInTheDocument();

    rerender(
      <ShadowingModal
        isOpen={false}
        onClose={handleClose}
        jpText="こんにちは。"
        enText="Hello."
      />
    );
    expect(screen.queryByText("Shadowing Studio")).not.toBeInTheDocument();
  });

  it("navigates through multiple sentences using Next and Prev buttons", () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="今日はいい天気ですね。散歩に行きましょう。"
        enText="It is a nice day today. Let's go for a walk."
      />
    );

    // Initial sentence: Sentence 1
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("今日はいい天気ですね。")).toBeInTheDocument();
    expect(screen.getByText(/It is a nice day today/i)).toBeInTheDocument();

    // Click Next
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByText("散歩に行きましょう。")).toBeInTheDocument();
    expect(screen.getByText(/Let's go for a walk/i)).toBeInTheDocument();

    // Click Previous
    const prevBtn = screen.getByRole("button", { name: /Prev/i });
    fireEvent.click(prevBtn);
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("toggles furigana visibility", () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="猫"
        enText="Cat"
      />
    );

    const furiganaToggle = screen.getByRole("button", { name: /Furigana: ON/i });
    expect(furiganaToggle).toBeInTheDocument();

    fireEvent.click(furiganaToggle);
    expect(screen.getByRole("button", { name: /Furigana: OFF/i })).toBeInTheDocument();
  });

  it("changes native speech playback speed and plays audio", () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="日本語を勉強します。"
        enText="I study Japanese."
      />
    );

    // Default speed is 0.9x
    expect(screen.getByText(/Play Native Model \(0.9x\)/i)).toBeInTheDocument();

    // Change speed to 1.25x
    const speedBtn = screen.getByRole("button", { name: "1.25x" });
    fireEvent.click(speedBtn);

    expect(screen.getByText(/Play Native Model \(1.25x\)/i)).toBeInTheDocument();

    // Click play native model
    const playBtn = screen.getByRole("button", { name: /Play Native Model/i });
    fireEvent.click(playBtn);
    expect(mockSpeak).toHaveBeenCalledWith("日本語を勉強します。", "ja-JP", 1.25);
  });

  it("stops native speech if clicked while playing", () => {
    mockIsPlaying = true;
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="日本語"
        enText="Japanese"
      />
    );

    const stopBtn = screen.getByRole("button", { name: /Stop Playback/i });
    fireEvent.click(stopBtn);
    expect(mockStop).toHaveBeenCalled();
  });

  it("records user voice, plays recording, and deletes recording", async () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    const recordBtn = screen.getByRole("button", { name: /Start Recording/i });
    await act(async () => {
      fireEvent.click(recordBtn);
    });

    // Recording in progress
    const stopRecordBtn = screen.getByRole("button", { name: /Stop Recording/i });
    expect(stopRecordBtn).toBeInTheDocument();

    // Stop recording
    await act(async () => {
      fireEvent.click(stopRecordBtn);
    });

    // Shows recorded controls
    expect(screen.getByRole("button", { name: /Play Recording/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Compare/i })).toBeInTheDocument();

    // Play recording
    const playRecordBtn = screen.getByRole("button", { name: /Play Recording/i });
    await act(async () => {
      fireEvent.click(playRecordBtn);
    });

    // Delete recording
    const deleteBtn = screen.getByTitle("Delete recording to record again");
    fireEvent.click(deleteBtn);

    // Returns to idle start recording
    expect(screen.getByRole("button", { name: /Start Recording/i })).toBeInTheDocument();
  });

  it("runs sequential comparison of native model and user voice", async () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    // Record audio first
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Run sequential compare
    const compareBtn = screen.getByRole("button", { name: /Compare/i });
    await act(async () => {
      fireEvent.click(compareBtn);
    });

    expect(mockSpeak).toHaveBeenCalledWith("テスト", "ja-JP", 0.9);
  });

  it("handles microphone permission error gracefully", async () => {
    (navigator.mediaDevices.getUserMedia as any).mockRejectedValueOnce(
      new Error("Permission denied")
    );

    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });

    expect(
      screen.getByText("Could not access microphone. Please check browser permissions.")
    ).toBeInTheDocument();
  });

  it("shows error if browser does not support mediaDevices", async () => {
    Object.defineProperty(navigator, "mediaDevices", {
      writable: true,
      value: undefined,
    });

    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });

    expect(
      screen.getByText("Your browser does not support microphone audio recording.")
    ).toBeInTheDocument();
  });

  it("navigates sentences using sentence indicator dots", () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="第一文。第二文。第三文。"
        enText="First. Second. Third."
      />
    );

    // Initial sentence is 第一文。
    expect(screen.getByText("第一文。")).toBeInTheDocument();

    // Click dot for index 1
    const dots = screen.getAllByRole("button").filter(b => b.className.includes("rounded-full") && b.className.includes("cursor-pointer") && !b.textContent);
    if (dots[1]) {
      fireEvent.click(dots[1]);
      expect(screen.getByText("第二文。")).toBeInTheDocument();
    }
  });

  it("handles text with more than 8 sentences by displaying sentence count label", () => {
    const nineSentences = Array.from({ length: 9 }, (_, i) => `文${i + 1}。`).join("");
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText={nineSentences}
      />
    );

    expect(screen.getByText("Sentence 1 of 9")).toBeInTheDocument();
  });

  it("stops native speech when already playing", () => {
    mockIsPlaying = true;
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト。"
      />
    );

    const stopBtn = screen.getByRole("button", { name: /Stop Playback/i });
    fireEvent.click(stopBtn);
    expect(mockStop).toHaveBeenCalled();
  });

  it("allows pausing user audio playback", async () => {
    MockAudio.autoEnd = false;
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Start playing
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Play Recording/i }));
    });

    // Expect Pause button to be visible
    const pauseBtn = screen.getByRole("button", { name: /Pause/i });
    expect(pauseBtn).toBeInTheDocument();

    // Click pause
    act(() => {
      fireEvent.click(pauseBtn);
    });

    // Should return to Play Recording
    expect(screen.getByRole("button", { name: /Play Recording/i })).toBeInTheDocument();
  });

  it("allows stopping comparison mode while active", async () => {
    mockSpeak.mockImplementationOnce(() => new Promise(() => {}));

    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Start compare
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Compare/i }));
    });

    // Expect Stop Comparison button
    const stopCompareBtn = screen.getByRole("button", { name: /Stop Comparison/i });
    expect(stopCompareBtn).toBeInTheDocument();

    // Click Stop Comparison
    act(() => {
      fireEvent.click(stopCompareBtn);
    });

    // Compare should be stopped
    expect(screen.getByRole("button", { name: /Compare: Native vs Your Voice/i })).toBeInTheDocument();
  });

  it("handles error during sequential comparison gracefully", async () => {
    mockSpeak.mockRejectedValueOnce(new Error("Audio synthesis error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Start compare
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Compare/i }));
    });

    expect(consoleSpy).toHaveBeenCalledWith("Error during sequential comparison:", expect.any(Error));
    consoleSpy.mockRestore();
  });

  it("handles dialog Escape key and user audio playback error", async () => {
    const handleClose = vi.fn();
    render(
      <ShadowingModal
        isOpen={true}
        onClose={handleClose}
        jpText="テスト"
        enText="Test"
      />
    );

    // Escape closes modal
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(handleClose).toHaveBeenCalled();

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Simulate audio error during play
    MockAudio.autoEnd = false;
    MockAudio.playReject = true;

    try {
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: /Play Recording/i }));
      });

      // After rejection, should reset to Play Recording
      await waitFor(() => {
        expect(screen.getByRole("button", { name: /Play Recording/i })).toBeInTheDocument();
      });
    } finally {
      MockAudio.playReject = false;
    }
  });

  it("stops comparison while user recording playback is active", async () => {
    MockAudio.autoEnd = false;
    mockSpeak.mockResolvedValueOnce(undefined);

    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Start compare
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Compare/i }));
    });

    // Wait for native speech (instant) and pause 400ms to enter user audio playback
    await act(async () => {
      await new Promise((r) => setTimeout(r, 450));
    });

    // Stop comparison during user audio phase
    const stopBtn = screen.getByRole("button", { name: /Stop Comparison/i });
    act(() => {
      fireEvent.click(stopBtn);
    });

    expect(screen.getByRole("button", { name: /Compare: Native vs Your Voice/i })).toBeInTheDocument();
  });

  it("handles user audio playback with onerror event", async () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Trigger audio onerror
    MockAudio.autoEnd = false;
    MockAudio.triggerError = true;

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Play Recording/i }));
    });

    // Verify it recovers cleanly back to Play Recording
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Play Recording/i })).toBeInTheDocument();
    });
  });

  it("handles user audio playback when already playing", async () => {
    MockAudio.autoEnd = false;
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="テスト"
        enText="Test"
      />
    );

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Play recording - audio remains active
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Play Recording/i }));
    });

    // Button now shows Pause
    const pauseBtn = screen.getByRole("button", { name: /Pause/i });
    expect(pauseBtn).toBeInTheDocument();

    // Click Pause
    act(() => {
      fireEvent.click(pauseBtn);
    });

    // Reverts to Play Recording
    expect(screen.getByRole("button", { name: /Play Recording/i })).toBeInTheDocument();
  });

  it("handles empty or missing jpText and enText gracefully", () => {
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText=""
        enText=""
      />
    );

    expect(screen.getByText("Shadowing Studio")).toBeInTheDocument();
    expect(screen.getByTestId("mock-tokenized-text")).toBeInTheDocument();
  });

  it("handles text with more than 8 sentences showing sentence counter text", () => {
    const tenSentences = Array.from({ length: 10 }, (_, i) => `センテンス${i + 1}。`).join("");
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText={tenSentences}
        enText="Sentences."
      />
    );

    expect(screen.getByText("Sentence 1 of 10")).toBeInTheDocument();

    // Navigate to next
    const nextBtn = screen.getByRole("button", { name: /Next/i });
    fireEvent.click(nextBtn);

    expect(screen.getByText("Sentence 2 of 10")).toBeInTheDocument();
  });

  it("pauses active user audio and cleans up when navigating to another sentence", async () => {
    MockAudio.autoEnd = false;
    render(
      <ShadowingModal
        isOpen={true}
        onClose={vi.fn()}
        jpText="一。二。"
        enText="One. Two."
      />
    );

    // Record audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Start Recording/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Stop Recording/i }));
    });

    // Start playing user audio
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Play Recording/i }));
    });

    // While playing, switch sentence
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: /Next/i }));
    });

    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
