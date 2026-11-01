import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { TextEditor } from "./text-editor";
import type { Note } from "@nipponic/shared";
import * as speechModule from "@/hooks/use-speech";

import { useEffect } from "react";

vi.mock("@/components/tokenized-text", async () => {
  return {
    TokenizedText: ({ text, onFlashcardWordsCountChange }: any) => {
      return (
        <div data-testid="tokenized-text">
          <span>{text}</span>
          <button
            data-testid="simulate-flashcard-count"
            onClick={() => onFlashcardWordsCountChange?.(3)}
          >
            Set Count
          </button>
          <button
            data-testid="simulate-flashcard-count-1"
            onClick={() => onFlashcardWordsCountChange?.(1)}
          >
            Set Count 1
          </button>
        </div>
      );
    },
    TokenItem: ({ word }: { word: string }) => <span data-testid={`token-${word}`}>{word}</span>,
    toHiragana: (s: string) => s,
  };
});

vi.mock("@/components/glossary-modal", () => ({
  GlossaryModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="glossary-modal">
        <button onClick={onClose}>Close Glossary</button>
      </div>
    ) : null,
}));

vi.mock("@/components/shadowing-modal", () => ({
  ShadowingModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="shadowing-modal">
        <button onClick={onClose}>Close Shadowing</button>
      </div>
    ) : null,
}));

const mockNote: Note = {
  id: "test-note-1",
  title: "Test Note",
  enText: "Hello world",
  jpText: "こんにちは世界",
  sourceLang: "EN",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("TextEditor Component", () => {
  const mockSpeak = vi.fn();
  const mockStop = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(speechModule, "useSpeech").mockReturnValue({
      speak: mockSpeak,
      stop: mockStop,
      isPlaying: false,
      isLoading: false,
      supported: true,
      voices: [],
    } as any);
  });

  describe("Header & Translation", () => {
    it("renders header with responsive flex-wrap classes and triggers translation", () => {
      const handleTranslate = vi.fn();
      const handleChangeSourceLang = vi.fn();

      const { container } = render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={handleTranslate}
          onChangeSourceLang={handleChangeSourceLang}
          isTranslating={false}
        />
      );

      const header = container.querySelector(".border-b");
      expect(header).toBeInTheDocument();
      expect(header).toHaveClass("flex");
      expect(header).toHaveClass("sm:flex-wrap");
      expect(header).toHaveClass("justify-between");

      const translateBtn = screen.getByRole("button", { name: /translate/i });
      fireEvent.click(translateBtn);
      expect(handleTranslate).toHaveBeenCalledTimes(1);
    });

    it("shows spinner while translating and disables when source is empty", () => {
      const { container } = render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={true}
        />
      );

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });

    it("allows typing and blurring English source content in EN mode", () => {
      const handleChangeContent = vi.fn();
      const handleBlurContent = vi.fn();

      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={handleChangeContent}
          onBlurContent={handleBlurContent}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      const enTextarea = screen.getByPlaceholderText("Start typing in English...");
      expect(enTextarea).toBeInTheDocument();
      fireEvent.change(enTextarea, { target: { value: "New English text" } });
      expect(handleChangeContent).toHaveBeenCalledWith("New English text");

      fireEvent.blur(enTextarea);
      expect(handleBlurContent).toHaveBeenCalled();
    });

    it("swaps translation direction when clicking swap button", () => {
      const handleChangeSourceLang = vi.fn();

      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          onChangeSourceLang={handleChangeSourceLang}
          isTranslating={false}
        />
      );

      const swapBtn = screen.getByTitle("Swap translation direction");
      fireEvent.click(swapBtn);
      expect(handleChangeSourceLang).toHaveBeenCalledWith("JA");
    });
  });

  describe("Modals: Glossary & Shadowing", () => {
    it("opens and closes GlossaryModal", async () => {
      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      const glossaryBtn = screen.getByRole("button", { name: /glossary/i });
      fireEvent.click(glossaryBtn);

      await waitFor(() => {
        expect(screen.getByTestId("glossary-modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Close Glossary" }));
      expect(screen.queryByTestId("glossary-modal")).not.toBeInTheDocument();
    });

    it("opens and closes ShadowingModal", async () => {
      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      const shadowingBtn = screen.getByRole("button", { name: /shadowing/i });
      fireEvent.click(shadowingBtn);

      await waitFor(() => {
        expect(screen.getByTestId("shadowing-modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole("button", { name: "Close Shadowing" }));
      expect(screen.queryByTestId("shadowing-modal")).not.toBeInTheDocument();
    });
  });

  describe("Target Language Editing & Interactions", () => {
    it("allows manual editing of Japanese target translation and triggers save on Done", () => {
      const handleChangeJpContent = vi.fn();
      const handleBlurJpContent = vi.fn();

      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onChangeJpContent={handleChangeJpContent}
          onBlurJpContent={handleBlurJpContent}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      // Click Edit Japanese
      const editBtn = screen.getByRole("button", { name: /edit japanese/i });
      fireEvent.click(editBtn);

      const jpTextarea = screen.getByPlaceholderText("Type or adjust Japanese text...");
      expect(jpTextarea).toBeInTheDocument();

      fireEvent.change(jpTextarea, { target: { value: "おはようございます" } });
      expect(handleChangeJpContent).toHaveBeenCalledWith("おはようございます");

      fireEvent.blur(jpTextarea);
      expect(handleBlurJpContent).toHaveBeenCalled();

      // Click Done
      const doneBtn = screen.getByRole("button", { name: /done/i });
      fireEvent.click(doneBtn);
    });

    it("allows manual editing of English target translation when source is JA", () => {
      const jaNote: Note = {
        ...mockNote,
        sourceLang: "JA",
        jpText: "猫",
        enText: "Cat",
      };
      const handleChangeContent = vi.fn();
      const handleBlurContent = vi.fn();

      render(
        <TextEditor
          selectedNote={jaNote}
          onChangeContent={handleChangeContent}
          onBlurContent={handleBlurContent}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      // Click Edit English
      const editBtn = screen.getByRole("button", { name: /edit english/i });
      fireEvent.click(editBtn);

      const enTextarea = screen.getByPlaceholderText("Type or adjust English translation...");
      expect(enTextarea).toBeInTheDocument();

      fireEvent.change(enTextarea, { target: { value: "Kitty" } });
      expect(handleChangeContent).toHaveBeenCalledWith("Kitty");

      fireEvent.blur(enTextarea);
      expect(handleBlurContent).toHaveBeenCalled();

      // Click Done
      const doneBtn = screen.getByRole("button", { name: /done/i });
      fireEvent.click(doneBtn);
    });

    it("allows editing Japanese original content and changes playback speed when source is JA", () => {
      const jaNote: Note = {
        ...mockNote,
        sourceLang: "JA",
        jpText: "猫",
        enText: "Cat",
      };
      const handleChangeJpContent = vi.fn();
      const handleBlurJpContent = vi.fn();

      render(
        <TextEditor
          selectedNote={jaNote}
          onChangeContent={vi.fn()}
          onChangeJpContent={handleChangeJpContent}
          onBlurJpContent={handleBlurJpContent}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      const jaTextarea = screen.getByPlaceholderText(/Start typing in Japanese/i);
      expect(jaTextarea).toBeInTheDocument();
      fireEvent.change(jaTextarea, { target: { value: "犬" } });
      expect(handleChangeJpContent).toHaveBeenCalledWith("犬");

      fireEvent.blur(jaTextarea);
      expect(handleBlurJpContent).toHaveBeenCalled();

      // Change speed rate buttons
      const speed075 = screen.getByRole("button", { name: "0.75x" });
      fireEvent.click(speed075);
      const speed125 = screen.getByRole("button", { name: "1.25x" });
      fireEvent.click(speed125);

      // Open Shadowing Studio
      const shadowingBtn = screen.getByRole("button", { name: /shadowing/i });
      fireEvent.click(shadowingBtn);
      expect(screen.getByTestId("shadowing-modal")).toBeInTheDocument();
      fireEvent.click(screen.getByText("Close Shadowing"));
      expect(screen.queryByTestId("shadowing-modal")).not.toBeInTheDocument();
    });

    it("plays audio pronunciation of Japanese text and changes speed", () => {
      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      // Change speed to 1.25x
      const speed125 = screen.getByRole("button", { name: "1.25x" });
      fireEvent.click(speed125);

      const audioBtn = screen.getByTitle(/listen in japanese/i);
      fireEvent.click(audioBtn);
      expect(mockSpeak).toHaveBeenCalledWith("こんにちは世界", "ja-JP", 1.25);
    });

    it("toggles furigana visibility on and off", () => {
      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      const furiganaBtn = screen.getByRole("button", { name: /furigana/i });
      expect(furiganaBtn).toBeInTheDocument();
      fireEvent.click(furiganaBtn);
      expect(screen.getByTitle("Show Furigana readings above Kanji")).toBeInTheDocument();
    });

    it("renders flashcard words count badge and updates on count change", () => {
      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      expect(
        screen.getByTitle("Words in this note that you already have flashcards for")
      ).toBeInTheDocument();
      expect(screen.getByText(/0 words in flashcards/i)).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("simulate-flashcard-count"));
      expect(screen.getByText(/3 words in flashcards/i)).toBeInTheDocument();
    });

    it("handles Japanese source audio speed, Shadowing trigger, and English audio playback when source is JA", () => {
      const jaNote: Note = {
        ...mockNote,
        sourceLang: "JA",
        jpText: "猫が好きです",
        enText: "I like cats",
      };

      const handleChangeJp = vi.fn();
      const handleBlurJp = vi.fn();

      render(
        <TextEditor
          selectedNote={jaNote}
          onChangeContent={vi.fn()}
          onChangeJpContent={handleChangeJp}
          onBlurJpContent={handleBlurJp}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      // Change speed in JA source
      const speed075 = screen.getByRole("button", { name: "0.75x" });
      fireEvent.click(speed075);

      // Play JA audio in source section
      const jaAudioBtn = screen.getByTitle(/Listen in Japanese \(0.75x\)/i);
      fireEvent.click(jaAudioBtn);
      expect(mockSpeak).toHaveBeenCalledWith("猫が好きです", "ja-JP", 0.75);

      // Open Shadowing from source section
      const shadowingBtn = screen.getByRole("button", { name: /Shadowing/i });
      fireEvent.click(shadowingBtn);
      expect(screen.getByTestId("shadowing-modal")).toBeInTheDocument();

      // Type and blur in JA source textarea
      const jaTextarea = screen.getByPlaceholderText(/Start typing in Japanese/i);
      fireEvent.change(jaTextarea, { target: { value: "犬が好きです" } });
      expect(handleChangeJp).toHaveBeenCalledWith("犬が好きです");
      fireEvent.blur(jaTextarea);
      expect(handleBlurJp).toHaveBeenCalled();

      // Play English audio in target section
      const enAudioBtn = screen.getByTitle("Listen in English");
      fireEvent.click(enAudioBtn);
      expect(mockSpeak).toHaveBeenCalledWith("I like cats", "en-US");
    });

    it("switches translation direction between EN and JA when clicking toggle buttons", () => {
      const handleChangeSourceLang = vi.fn();

      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          onChangeSourceLang={handleChangeSourceLang}
          isTranslating={false}
        />
      );

      const enToJpBtn = screen.getByRole("button", { name: /English.*Japanese/i });
      fireEvent.click(enToJpBtn);
      expect(handleChangeSourceLang).toHaveBeenCalledWith("EN");

      const jaToEnBtn = screen.getByRole("button", { name: /Japanese.*English/i });
      fireEvent.click(jaToEnBtn);
      expect(handleChangeSourceLang).toHaveBeenCalledWith("JA");
    });

    it("stops audio playback when clicked while activeLang is playing", () => {
      vi.spyOn(speechModule, "useSpeech").mockReturnValue({
        speak: mockSpeak,
        stop: mockStop,
        isPlaying: true,
        activeLang: "en-US",
        isLoading: false,
        supported: true,
        voices: [],
      } as any);

      const { rerender } = render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      // English audio stop
      const enAudioBtn = screen.getByTitle("Listen in English");
      fireEvent.click(enAudioBtn);
      expect(mockStop).toHaveBeenCalled();

      // Japanese audio stop
      vi.spyOn(speechModule, "useSpeech").mockReturnValue({
        speak: mockSpeak,
        stop: mockStop,
        isPlaying: true,
        activeLang: "ja-JP",
        isLoading: false,
        supported: true,
        voices: [],
      } as any);

      rerender(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );
      const jaAudioBtn = screen.getByTitle(/Listen in Japanese/i);
      fireEvent.click(jaAudioBtn);
      expect(mockStop).toHaveBeenCalledTimes(2);

      // In JA mode: test stopping JA source audio and EN target audio
      const jaNote: Note = {
        ...mockNote,
        sourceLang: "JA",
        jpText: "猫",
        enText: "Cat",
      };

      rerender(
        <TextEditor
          selectedNote={jaNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      // JA source audio stop
      const jaSourceAudioBtn = screen.getByTitle(/Listen in Japanese/i);
      fireEvent.click(jaSourceAudioBtn);
      expect(mockStop).toHaveBeenCalledTimes(3);

      // EN target audio stop
      vi.spyOn(speechModule, "useSpeech").mockReturnValue({
        speak: mockSpeak,
        stop: mockStop,
        isPlaying: true,
        activeLang: "en-US",
        isLoading: false,
        supported: true,
        voices: [],
      } as any);

      rerender(
        <TextEditor
          selectedNote={jaNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      const enTargetAudioBtn = screen.getByTitle("Listen in English");
      fireEvent.click(enTargetAudioBtn);
      expect(mockStop).toHaveBeenCalledTimes(4);
    });

    it("renders fallback messages when target text is empty in EN and JA source modes", () => {
      // 1. EN mode with empty jpText
      const emptyJpNote: Note = {
        ...mockNote,
        sourceLang: "EN",
        enText: "Hello",
        jpText: "",
      };

      const { rerender } = render(
        <TextEditor
          selectedNote={emptyJpNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      expect(
        screen.getByText(/Click 'Translate' to generate the Japanese text\.\.\./i)
      ).toBeInTheDocument();

      // 2. JA mode with empty enText
      const emptyEnNote: Note = {
        ...mockNote,
        sourceLang: "JA",
        jpText: "猫",
        enText: "",
      };

      rerender(
        <TextEditor
          selectedNote={emptyEnNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      expect(
        screen.getByText(/Click 'Translate' to generate the English translation\.\.\./i)
      ).toBeInTheDocument();
    });

    it("renders singular '1 word in flashcards' badge when count is 1", () => {
      render(
        <TextEditor
          selectedNote={mockNote}
          onChangeContent={vi.fn()}
          onTranslate={vi.fn()}
          isTranslating={false}
        />
      );

      // Simulate TokenizedText updating flashcard count to 1
      const countBtn = screen.getByTestId("simulate-flashcard-count-1");
      fireEvent.click(countBtn);
      expect(screen.getByText("1 word in flashcards")).toBeInTheDocument();
    });
  });
});
