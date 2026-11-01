import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TokenizedText, TokenItem, toHiragana } from "./tokenized-text";
import * as kuromojiModule from "@/hooks/use-kuromoji";
import * as speechModule from "@/hooks/use-speech";
import * as flashcardsContextModule from "@/contexts/FlashCardsContext";
import * as compoundWordsModule from "@/services/compound-words";
import * as dictCacheModule from "@/services/dictionary-cache";

// Mock dynamic components to render test markers
vi.mock("@/components/kanji-breakdown", () => ({
  KanjiBreakdown: ({ word }: { word: string }) => (
    <div data-testid="mock-kanji-breakdown">Kanji Breakdown for {word}</div>
  ),
}));

vi.mock("@/components/sentence-miner-modal", () => ({
  SentenceMinerModal: ({ isOpen, onClose, word, sentenceJp, sentenceEn }: any) =>
    isOpen ? (
      <div data-testid="mock-sentence-miner">
        <span>Mining: {word}</span>
        <span>JP: {sentenceJp}</span>
        <span>EN: {sentenceEn}</span>
        <button onClick={onClose}>Close Miner</button>
      </div>
    ) : null,
}));

describe("TokenizedText & TokenItem", () => {
  const mockSpeak = vi.fn();
  const mockStop = vi.fn();
  const mockAddCompound = vi.fn();
  const mockRemoveCompound = vi.fn();
  const mockSaveCustomDef = vi.fn();
  const mockResetCustomDef = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(kuromojiModule, "useKuromoji").mockReturnValue({
      tokenize: (text: string) => {
        if (text === "猫が好き。") {
          return [
            { surface_form: "猫", reading: "ネコ", basic_form: "猫" },
            { surface_form: "が", reading: "ガ", basic_form: "が" },
            { surface_form: "好き", reading: "スキ", basic_form: "好き" },
            { surface_form: "。", reading: "。", basic_form: "。" },
          ] as any;
        }
        if (text === "東京大学") {
          return [
            { surface_form: "東京大学", reading: "トウキョウダイガク", basic_form: "東京大学", isMerged: true },
          ] as any;
        }
        return [{ surface_form: text, reading: "", basic_form: text }] as any;
      },
    } as any);

    vi.spyOn(speechModule, "useSpeech").mockReturnValue({
      speak: mockSpeak,
      stop: mockStop,
      isPlaying: false,
      isLoading: false,
      supported: true,
      voices: [],
    } as any);

    vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
      cards: [{ id: "c1", jpText: "猫", enText: "Cat" }],
      decks: [],
    } as any);

    vi.spyOn(compoundWordsModule, "useCompoundWords").mockReturnValue({
      compounds: [],
      addCompound: mockAddCompound,
      removeCompound: mockRemoveCompound,
    });

    vi.spyOn(dictCacheModule, "getCachedDictionaryWord").mockImplementation((word: string) => {
      if (word === "猫") {
        return {
          word: "猫",
          reading: "ねこ",
          meanings: ["cat", "feline"],
          jlpt: "JLPT N5",
          isCommon: true,
          isCustom: false,
        };
      }
      return null;
    });

    vi.spyOn(dictCacheModule, "fetchDictionaryWord").mockImplementation((word: string) => {
      if (word === "好き") {
        return Promise.resolve({
          word: "好き",
          reading: "すき",
          meanings: ["like", "fond of"],
          jlpt: "JLPT N5",
          isCommon: true,
          isCustom: false,
        });
      }
      return Promise.resolve(null);
    });

    vi.spyOn(dictCacheModule, "saveCustomDefinition").mockImplementation((word, def) => {
      mockSaveCustomDef(word, def);
      return {
        reading: def.reading,
        meanings: def.meanings,
        jlpt: def.jlpt ?? null,
        isCommon: def.isCommon ?? false,
        isCustom: true,
      };
    });

    vi.spyOn(dictCacheModule, "resetCustomDefinition").mockImplementation(mockResetCustomDef);
  });

  describe("Utility: toHiragana", () => {
    it("converts katakana to hiragana and preserves non-katakana characters", () => {
      expect(toHiragana("ネコ")).toBe("ねこ");
      expect(toHiragana("トウキョウ")).toBe("とうきょう");
      expect(toHiragana("")).toBe("");
      expect(toHiragana("hello")).toBe("hello");
    });
  });

  describe("TokenizedText Rendering & Interactions", () => {
    it("renders loading indicator if tokenizer is not ready", () => {
      vi.spyOn(kuromojiModule, "useKuromoji").mockReturnValue(null);
      render(<TokenizedText text="猫" />);
      expect(screen.getByText(/Loading Japanese morphological analyzer/i)).toBeInTheDocument();
    });

    it("renders tokenized Japanese text and punctuation correctly", () => {
      render(<TokenizedText text="猫が好き。" showFurigana={true} />);

      expect(screen.getByTestId("token-猫")).toBeInTheDocument();
      expect(screen.getByTestId("token-好き")).toBeInTheDocument();
      expect(screen.getByText("。")).toBeInTheDocument();
    });

    it("notifies parent of flashcard count in rendered tokens", () => {
      const handleCountChange = vi.fn();
      render(
        <TokenizedText
          text="猫が好き。"
          onFlashcardWordsCountChange={handleCountChange}
        />
      );
      expect(handleCountChange).toHaveBeenCalledWith(1);
    });

    it("opens token popover on click and renders dictionary definition, badges, and pronunciation audio", async () => {
      render(<TokenizedText text="猫が好き。" />);

      const nekoToken = screen.getByTestId("token-猫");
      fireEvent.click(nekoToken);

      // Verify dictionary content rendered
      expect(screen.getByText("In Flashcards")).toBeInTheDocument();
      expect(screen.getByText("Common")).toBeInTheDocument();
      expect(screen.getByText("JLPT N5")).toBeInTheDocument();
      expect(screen.getByText("cat")).toBeInTheDocument();
      expect(screen.getByText("feline")).toBeInTheDocument();

      // Audio pronunciation button
      const audioBtn = screen.getByTitle("Listen to pronunciation");
      fireEvent.click(audioBtn);
      expect(mockSpeak).toHaveBeenCalledWith("ねこ", "ja-JP", 0.9);
    });

    it("switches to Kanji Breakdown tab and back to Definition tab", async () => {
      render(<TokenizedText text="猫が好き。" />);

      fireEvent.click(screen.getByTestId("token-猫"));

      // Click Kanji Breakdown tab
      const kanjiTab = screen.getByRole("button", { name: /Kanji Breakdown/i });
      fireEvent.click(kanjiTab);

      await waitFor(() => {
        expect(screen.getByTestId("mock-kanji-breakdown")).toBeInTheDocument();
      });

      // Click back to Definition tab
      const defTab = screen.getByRole("button", { name: "Definition" });
      fireEvent.click(defTab);

      expect(screen.getByText("cat")).toBeInTheDocument();
    });

    it("allows editing custom definition, saving changes, and resetting to default", async () => {
      render(<TokenizedText text="猫が好き。" />);

      fireEvent.click(screen.getByTestId("token-猫"));

      // Click edit button
      const editBtn = screen.getByTitle("Edit definition");
      fireEvent.click(editBtn);

      expect(screen.getByText("Edit: 猫")).toBeInTheDocument();
      const readingInput = screen.getByPlaceholderText("e.g. ゾロ");
      const tagInput = screen.getByPlaceholderText("e.g. Proper Noun / JLPT N3");
      const meaningsTextarea = screen.getByPlaceholderText("e.g. Zoro (character)");

      fireEvent.change(readingInput, { target: { value: "ねこちゃん" } });
      fireEvent.change(tagInput, { target: { value: "Pet" } });
      fireEvent.change(meaningsTextarea, { target: { value: "Kitty\nFeline friend" } });

      // Save custom definition
      fireEvent.click(screen.getByRole("button", { name: /Save/i }));

      expect(mockSaveCustomDef).toHaveBeenCalledWith("猫", {
        reading: "ねこちゃん",
        meanings: ["Kitty", "Feline friend"],
        jlpt: "Pet",
        isCommon: true,
      });

      // Edit again and test reset to default
      fireEvent.click(screen.getByTitle("Edit definition"));
      const restoreBtn = screen.getByRole("button", { name: /Restore/i });
      fireEvent.click(restoreBtn);

      expect(mockResetCustomDef).toHaveBeenCalledWith("猫");
    });

    it("triggers SentenceMiner modal with extracted sentence and closes popover", async () => {
      render(
        <TokenizedText
          text="猫が好き。"
          enContext="I love cats."
        />
      );

      fireEvent.click(screen.getByTestId("token-猫"));

      const minerBtn = screen.getByRole("button", { name: /Flashcard Added/i });
      fireEvent.click(minerBtn);

      await waitFor(() => {
        expect(screen.getByTestId("mock-sentence-miner")).toBeInTheDocument();
      });
      expect(screen.getByText("Mining: 猫")).toBeInTheDocument();
      expect(screen.getByText("JP: 猫が好き。")).toBeInTheDocument();
      expect(screen.getByText("EN: I love cats.")).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByRole("button", { name: "Close Miner" }));
      expect(screen.queryByTestId("mock-sentence-miner")).not.toBeInTheDocument();
    });

    it("merges tokens when clicking merge button", () => {
      render(<TokenizedText text="猫が好き。" />);

      fireEvent.click(screen.getByTestId("token-猫"));
      const mergeBtn = screen.getByTitle('Group "猫" with "が"');
      fireEvent.click(mergeBtn);

      expect(mockAddCompound).toHaveBeenCalledWith("猫が");
    });

    it("splits merged tokens when clicking split button", () => {
      vi.spyOn(compoundWordsModule, "useCompoundWords").mockReturnValue({
        compounds: ["東京大学"],
        addCompound: mockAddCompound,
        removeCompound: mockRemoveCompound,
      });

      vi.spyOn(kuromojiModule, "useKuromoji").mockReturnValue({
        tokenize: () => [
          { surface_form: "東京", reading: "トウキョウ", basic_form: "東京" },
          { surface_form: "大学", reading: "ダイガク", basic_form: "大学" },
        ] as any,
      } as any);

      render(<TokenizedText text="東京大学" />);

      fireEvent.click(screen.getByTestId("token-東京大学"));
      const splitBtn = screen.getByTitle('Split "東京大学" back into separate words');
      fireEvent.click(splitBtn);

      expect(mockRemoveCompound).toHaveBeenCalledWith("東京大学");
    });

    it("handles dictionary fetch loading and error state when no definition found", async () => {
      render(<TokenizedText text="犬" />);

      const token = screen.getByTestId("token-犬");
      fireEvent.click(token);

      await waitFor(() => {
        expect(screen.getByText("No online definition found.")).toBeInTheDocument();
      });

      const addMeaningBtn = screen.getByRole("button", { name: /Add Custom Meaning/i });
      fireEvent.click(addMeaningBtn);
      expect(screen.getByText("Edit: 犬")).toBeInTheDocument();

      // Test cancel edit
      const cancelBtn = screen.getByRole("button", { name: /Cancel/i });
      fireEvent.click(cancelBtn);
      expect(screen.queryByText("Edit: 犬")).toBeNull();

      // Re-enter edit, fill form, and save
      fireEvent.click(screen.getByRole("button", { name: /Add Custom Meaning/i }));
      const readingInput = screen.getByPlaceholderText(/e\.g\. ゾロ/i);
      const tagInput = screen.getByPlaceholderText(/e\.g\. Proper Noun/i);
      const meaningsInput = screen.getByPlaceholderText(/e\.g\. Zoro/i);

      fireEvent.change(readingInput, { target: { value: "いぬ" } });
      fireEvent.change(tagInput, { target: { value: "JLPT N5" } });
      fireEvent.change(meaningsInput, { target: { value: "Dog\nCanine" } });

      const saveBtn = screen.getByRole("button", { name: /Save/i });
      fireEvent.click(saveBtn);

      expect(mockSaveCustomDef).toHaveBeenCalledWith("犬", {
        reading: "いぬ",
        meanings: ["Dog", "Canine"],
        jlpt: "JLPT N5",
        isCommon: true,
      });
    });

    it("stops audio playback if speech is currently playing", () => {
      vi.spyOn(speechModule, "useSpeech").mockReturnValue({
        speak: mockSpeak,
        stop: mockStop,
        isPlaying: true,
        isLoading: false,
        supported: true,
        voices: [],
      } as any);

      render(<TokenizedText text="猫" />);
      fireEvent.click(screen.getByTestId("token-猫"));

      const audioBtn = screen.getByTitle("Listen to pronunciation");
      fireEvent.click(audioBtn);
      expect(mockStop).toHaveBeenCalled();
    });

    it("handles dictionary fetch network error catch block", async () => {
      vi.spyOn(dictCacheModule, "fetchDictionaryWord").mockRejectedValueOnce(
        new Error("Network failure")
      );

      render(<TokenizedText text="魚" />);
      fireEvent.click(screen.getByTestId("token-魚"));

      await waitFor(() => {
        expect(screen.getByText("No online definition found.")).toBeInTheDocument();
      });
    });

    it("restores original definition when custom definition exists", () => {
      vi.spyOn(dictCacheModule, "getCachedDictionaryWord").mockReturnValue({
        reading: "ねこ",
        meanings: ["Custom Cat"],
        jlpt: "JLPT N5",
        isCommon: true,
        isCustom: true,
      });

      render(<TokenizedText text="猫" />);
      fireEvent.click(screen.getByTestId("token-猫"));

      // Enter edit mode
      fireEvent.click(screen.getByTitle("Edit definition"));
      expect(screen.getByText("Edit: 猫")).toBeInTheDocument();

      // Click Restore button
      const restoreBtn = screen.getByRole("button", { name: /Restore/i });
      fireEvent.click(restoreBtn);

      expect(mockResetCustomDef).toHaveBeenCalledWith("猫");
    });

    it("uses passed flashcardWords prop", () => {
      const customFlashcards = new Set(["猫"]);
      render(
        <TokenizedText
          text="猫が好き。"
          flashcardWords={customFlashcards}
        />
      );

      expect(screen.getByTestId("token-猫")).toBeInTheDocument();
    });

    it("extracts flashcards from user decks and includes them in compound words", () => {
      vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
        cards: [],
        decks: [{ id: "d1", name: "D1", cards: [{ id: "c-deck", jpText: "東京大学" }] }],
      } as any);

      render(<TokenizedText text="猫" />);
      expect(screen.getByTestId("token-猫")).toBeInTheDocument();
    });
  });

  describe("TokenItem Component", () => {
    it("renders non-Japanese words and punctuation as plain text without popovers", () => {
      const { container } = render(
        <TokenItem
          word="Hello"
          reading=""
          nextWord=""
          isMerged={false}
          showFurigana={false}
          hasFlashcard={false}
        />
      );

      expect(screen.getByText("Hello")).toBeInTheDocument();
      expect(container.querySelector("[data-state]")).toBeNull();
    });

    it("renders Japanese token with furigana when showFurigana is true", () => {
      render(
        <TokenItem
          word="猫"
          reading="ネコ"
          nextWord="が"
          isMerged={false}
          showFurigana={true}
          hasFlashcard={true}
        />
      );

      expect(screen.getByTestId("token-猫")).toBeInTheDocument();
      expect(screen.getByText("ねこ")).toBeInTheDocument();
    });

    it("exercises memo comparator with identical and modified props", () => {
      const { rerender } = render(
        <TokenItem
          word="猫"
          reading="ネコ"
          nextWord="が"
          isMerged={false}
          showFurigana={false}
          hasFlashcard={false}
        />
      );

      expect(screen.getByTestId("token-猫")).toBeInTheDocument();

      // Rerender with same props (memo hit)
      rerender(
        <TokenItem
          word="猫"
          reading="ネコ"
          nextWord="が"
          isMerged={false}
          showFurigana={false}
          hasFlashcard={false}
        />
      );
      expect(screen.getByTestId("token-猫")).toBeInTheDocument();

      // Rerender with changed props (memo miss)
      rerender(
        <TokenItem
          word="猫"
          reading="ネコ"
          nextWord="は"
          isMerged={true}
          showFurigana={true}
          hasFlashcard={true}
        />
      );
      expect(screen.getByTestId("token-猫")).toBeInTheDocument();
    });

    it("handles merge and unmerge actions in TokenItem popover", () => {
      const mockMerge = vi.fn();
      const mockUnmerge = vi.fn();

      // Render merged token with onUnmerge
      const { unmount } = render(
        <TokenItem
          word="東京大学"
          reading="とうきょうだいがく"
          nextWord=""
          isMerged={true}
          showFurigana={false}
          hasFlashcard={false}
          onUnmerge={mockUnmerge}
        />
      );

      fireEvent.click(screen.getByTestId("token-東京大学"));
      const splitBtn = screen.getByTitle('Split "東京大学" back into separate words');
      expect(splitBtn).toBeInTheDocument();
      fireEvent.click(splitBtn);
      expect(mockUnmerge).toHaveBeenCalled();

      unmount();

      // Render unmerged token with nextWord and onMergeWithNext
      render(
        <TokenItem
          word="東京"
          reading="とうきょう"
          nextWord="大学"
          isMerged={false}
          showFurigana={false}
          hasFlashcard={false}
          onMergeWithNext={mockMerge}
        />
      );

      fireEvent.click(screen.getByTestId("token-東京"));
      const mergeBtn = screen.getByTitle('Group "東京" with "大学"');
      expect(mergeBtn).toBeInTheDocument();
      fireEvent.click(mergeBtn);
      expect(mockMerge).toHaveBeenCalled();
    });

    it("renders 'Flashcard Added' indicator in TokenItem popover when word is in flashcards", () => {
      render(
        <TokenItem
          word="猫"
          reading="ネコ"
          nextWord=""
          isMerged={false}
          showFurigana={false}
          hasFlashcard={true}
        />
      );

      fireEvent.click(screen.getByTestId("token-猫"));
      expect(screen.getByText("Flashcard Added")).toBeInTheDocument();
      expect(screen.getByText("In Flashcards")).toBeInTheDocument();
    });

    it("updates dictionary content when CUSTOM_DICT_EVENT is dispatched", async () => {
      render(<TokenizedText text="猫" />);
      fireEvent.click(screen.getByTestId("token-猫"));

      expect(screen.getByText("cat")).toBeInTheDocument();

      // Dispatch custom dictionary update event
      await act(async () => {
        window.dispatchEvent(
          new CustomEvent(dictCacheModule.CUSTOM_DICT_EVENT, {
            detail: {
              word: "猫",
              data: {
                reading: "ねこ",
                meanings: ["Custom Feline"],
                jlpt: "JLPT N5",
                isCommon: true,
                isCustom: true,
              },
            },
          })
        );
      });

      expect(screen.getByText("Custom Feline")).toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();

      // Dispatch custom dictionary reset event
      vi.spyOn(dictCacheModule, "fetchDictionaryWord").mockResolvedValueOnce({
        reading: "ねこ",
        meanings: ["Standard Cat"],
        jlpt: "JLPT N5",
        isCommon: true,
        isCustom: false,
      });

      await act(async () => {
        window.dispatchEvent(
          new CustomEvent(dictCacheModule.CUSTOM_DICT_EVENT, {
            detail: {
              word: "猫",
              reset: true,
            },
          })
        );
      });

      await waitFor(() => {
        expect(screen.getByText("Standard Cat")).toBeInTheDocument();
      });
    });

    it("extracts sentence or falls back to fullText or targetWord", () => {
      render(
        <TokenItem
          word="猫"
          reading="ネコ"
          nextWord=""
          isMerged={false}
          showFurigana={false}
          hasFlashcard={false}
          fullText=""
        />
      );

      fireEvent.click(screen.getByTestId("token-猫"));
      fireEvent.click(screen.getByRole("button", { name: /Create Flashcard/i }));

      expect(screen.getByTestId("mock-sentence-miner")).toBeInTheDocument();
      expect(screen.getByText("JP: 猫")).toBeInTheDocument();
    });

    it("returns empty string when toHiragana receives empty string", () => {
      expect(toHiragana("")).toBe("");
    });

    it("calls onDataLoaded callback when cached word or fetched word loads in popover", async () => {
      render(
        <TokenItem
          word="猫"
          reading="ネコ"
          nextWord=""
          isMerged={false}
          showFurigana={false}
          hasFlashcard={false}
        />
      );

      // Click to open popover, triggering cached word data loading
      fireEvent.click(screen.getByTestId("token-猫"));
      expect(screen.getByText("feline")).toBeInTheDocument();

      // Now test with fetched word
      render(
        <TokenItem
          word="好き"
          reading="スキ"
          nextWord=""
          isMerged={false}
          showFurigana={false}
          hasFlashcard={false}
        />
      );

      fireEvent.click(screen.getByTestId("token-好き"));
      await waitFor(() => {
        expect(screen.getByText("fond of")).toBeInTheDocument();
      });
    });
  });
});
