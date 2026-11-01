import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SentenceMinerModal } from "./sentence-miner-modal";

const mockCreateCard = vi.fn().mockResolvedValue({ id: "new-card-1" });
const mockCreateDeck = vi.fn().mockResolvedValue({ id: "new-deck-1", name: "Custom Deck", cards: [] });
const mockAddCardsToDeck = vi.fn().mockResolvedValue(undefined);
const mockOnClose = vi.fn();

const mockDecks = [
  { id: "deck-1", name: "JLPT N5", cards: [{ id: "c1" }] },
  { id: "deck-2", name: "Anime Vocab", cards: [] },
  { id: "deck-3", name: "Kanji Core", cards: [{ id: "c2" }, { id: "c3" }] },
];

let currentFlashcardContext = {
  decks: mockDecks,
  createCard: mockCreateCard,
  createDeck: mockCreateDeck,
  addCardsToDeck: mockAddCardsToDeck,
  selectedDeckId: "deck-1" as string | null,
};

vi.mock("@/contexts/FlashCardsContext", () => ({
  useFlashCards: () => currentFlashcardContext,
}));

describe("SentenceMinerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentFlashcardContext = {
      decks: mockDecks,
      createCard: mockCreateCard,
      createDeck: mockCreateDeck,
      addCardsToDeck: mockAddCardsToDeck,
      selectedDeckId: "deck-1",
    };
  });

  it("populates front with word, reading, and sentence context, and back with definition ONLY (ignoring sentenceEn / note text)", () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="食べる"
        reading="たべる"
        meanings={["to eat", "to consume"]}
        sentenceJp="毎朝パンを食べる。"
        sentenceEn="This is a giant note text that should NOT be in the back of the flashcard."
      />
    );

    expect(screen.getByRole("heading", { name: /create flashcard from note/i })).toBeInTheDocument();

    const frontInput = screen.getByPlaceholderText(/target word and sentence/i) as HTMLTextAreaElement;
    expect(frontInput.value).toBe("食べる (たべる)\n\n「毎朝パンを食べる。」");

    const backInput = screen.getByPlaceholderText(/meaning/i) as HTMLTextAreaElement;
    // Should ONLY contain definition, NOT the note text sentenceEn
    expect(backInput.value).toBe("to eat, to consume");
    expect(backInput.value).not.toContain("This is a giant note text");
  });

  it("does not include reading in parentheses when reading matches word, and defaults back to 'Meaning' if no meanings", () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="パン"
        reading="パン"
        meanings={[]}
        sentenceJp="パンが好き。"
      />
    );

    const frontInput = screen.getByPlaceholderText(/target word and sentence/i) as HTMLTextAreaElement;
    expect(frontInput.value).toBe("パン\n\n「パンが好き。」");

    const backInput = screen.getByPlaceholderText(/meaning/i) as HTMLTextAreaElement;
    expect(backInput.value).toBe("Meaning");
  });

  it("submits the card with definition-only back to multiple selected decks", async () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="猫"
        reading="ねこ"
        meanings={["cat", "feline"]}
        sentenceJp="猫が寝ている。"
        sentenceEn="Full note content that must not appear."
      />
    );

    // By default deck-1 is selected (active deck). Let's also select deck-2 (Anime Vocab)
    const animeCheckbox = screen.getByLabelText(/anime vocab/i);
    expect(animeCheckbox).not.toBeChecked();
    fireEvent.click(animeCheckbox);
    expect(animeCheckbox).toBeChecked();

    expect(screen.getByText(/2 selected/i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateCard).toHaveBeenCalledWith(
        {
          jpText: "猫 (ねこ)\n\n「猫が寝ている。」",
          enText: "cat, feline",
        },
        "deck-1"
      );
      expect(mockAddCardsToDeck).toHaveBeenCalledWith("deck-2", ["new-card-1"]);
    });
  });

  it("filters decks using the search input by deck name", () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="犬"
        reading="いぬ"
        meanings={["dog"]}
        sentenceJp="犬が走る。"
      />
    );

    expect(screen.getByText("JLPT N5")).toBeInTheDocument();
    expect(screen.getByText("Anime Vocab")).toBeInTheDocument();
    expect(screen.getByText("Kanji Core")).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(/search decks by name/i);
    fireEvent.change(searchInput, { target: { value: "anime" } });

    expect(screen.getByText("Anime Vocab")).toBeInTheDocument();
    expect(screen.queryByText("JLPT N5")).not.toBeInTheDocument();
    expect(screen.queryByText("Kanji Core")).not.toBeInTheDocument();

    // Clear search
    const clearBtn = screen.getByRole("button", { name: /clear deck search/i });
    fireEvent.click(clearBtn);

    expect(screen.getByText("JLPT N5")).toBeInTheDocument();
    expect(screen.getByText("Anime Vocab")).toBeInTheDocument();
  });

  it("submits the card to unassigned Arsenal when no decks are selected", async () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="本"
        reading="ほん"
        meanings={["book"]}
        sentenceJp="本を読む。"
      />
    );

    // Uncheck deck-1
    const jlptCheckbox = screen.getByLabelText(/jlpt n5/i);
    expect(jlptCheckbox).toBeChecked();
    fireEvent.click(jlptCheckbox);
    expect(jlptCheckbox).not.toBeChecked();

    expect(screen.getByText(/no deck selected\. card will be saved in your unassigned arsenal\./i)).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateCard).toHaveBeenCalledWith(
        {
          jpText: "本 (ほん)\n\n「本を読む。」",
          enText: "book",
        },
        undefined
      );
      expect(mockAddCardsToDeck).not.toHaveBeenCalled();
    });
  });

  it("allows creating a new deck directly from the modal and adds card to it", async () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="犬"
        reading="いぬ"
        meanings={["dog"]}
        sentenceJp="犬が走る。"
      />
    );

    // Uncheck preselected deck-1
    const jlptCheckbox = screen.getByLabelText(/jlpt n5/i);
    fireEvent.click(jlptCheckbox);

    // Switch to create new deck
    const toggleDeckBtn = screen.getByRole("button", { name: /create new deck/i });
    fireEvent.click(toggleDeckBtn);

    const newDeckInput = screen.getByPlaceholderText(/enter new deck name/i);
    fireEvent.change(newDeckInput, { target: { value: "Animals Deck" } });

    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateDeck).toHaveBeenCalledWith("Animals Deck");
      expect(mockCreateCard).toHaveBeenCalledWith(
        {
          jpText: "犬 (いぬ)\n\n「犬が走る。」",
          enText: "dog",
        },
        "new-deck-1"
      );
    });
  });

  it("handles successful creation timeout closing the modal", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="桜"
        reading="さくら"
        meanings={["cherry blossom"]}
        sentenceJp="桜が綺麗だ。"
      />
    );

    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Flashcard created and added/i)).toBeInTheDocument();
    });

    // Advance 1 second for timeout
    vi.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });

    vi.useRealTimers();
  });

  it("handles creation error gracefully", async () => {
    mockCreateCard.mockRejectedValueOnce(new Error("Database error"));
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="桜"
        reading="さくら"
        meanings={["cherry blossom"]}
        sentenceJp="桜が綺麗だ。"
      />
    );

    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith("Error creating card:", expect.any(Error));
    });

    consoleErrorSpy.mockRestore();
  });

  it("handles word without sentenceJp and blank text submission guard", () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="山"
        reading="やま"
        meanings={["mountain"]}
        sentenceJp=""
      />
    );

    const frontInput = screen.getByPlaceholderText(/target word and sentence/i) as HTMLTextAreaElement;
    expect(frontInput.value).toBe("山 (やま)");

    // Blank front input and try submit
    fireEvent.change(frontInput, { target: { value: "   " } });
    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);
    expect(mockCreateCard).not.toHaveBeenCalled();
  });

  it("handles no deck matches for search query and closes on Escape", () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="川"
        reading="かわ"
        meanings={["river"]}
        sentenceJp=""
      />
    );

    const searchInput = screen.getByPlaceholderText(/search decks by name/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent query" } });

    expect(screen.getByText(/no decks found matching/i)).toBeInTheDocument();

    // Escape closes dialog
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("handles editing back definition, guards against empty back input, and saves to arsenal when no decks selected", async () => {
    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="星"
        reading="ほし"
        meanings={["star"]}
        sentenceJp="星が綺麗。"
      />
    );

    const backInput = screen.getByPlaceholderText(/meaning/i);

    // 1. Edit back definition textarea (line 207)
    fireEvent.change(backInput, { target: { value: "celestial body, star" } });
    expect(backInput).toHaveValue("celestial body, star");

    // 2. Clear back input and test guard
    fireEvent.change(backInput, { target: { value: "   " } });
    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);
    expect(mockCreateCard).not.toHaveBeenCalled();

    // 3. Uncheck default selected deck (deck-1) so no decks are selected
    const jlptCheckbox = screen.getByLabelText(/jlpt n5/i);
    expect(jlptCheckbox).toBeChecked();
    fireEvent.click(jlptCheckbox);
    expect(jlptCheckbox).not.toBeChecked();

    // Put valid definition back
    fireEvent.change(backInput, { target: { value: "star" } });

    // Submit without decks -> saves to Arsenal
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateCard).toHaveBeenCalledWith(
        {
          jpText: "星 (ほし)\n\n「星が綺麗。」",
          enText: "star",
        },
        undefined
      );
      expect(screen.getByText("Flashcard created and added to your Arsenal!")).toBeInTheDocument();
    });
  });

  it("handles empty decks list and when new deck creation returns null", async () => {
    currentFlashcardContext = {
      decks: [],
      createCard: mockCreateCard,
      createDeck: vi.fn().mockResolvedValue(null),
      addCardsToDeck: mockAddCardsToDeck,
      selectedDeckId: null,
    };

    render(
      <SentenceMinerModal
        isOpen={true}
        onClose={mockOnClose}
        word="月"
        reading="つき"
        meanings={["moon"]}
        sentenceJp="月が綺麗。"
      />
    );

    // Notice for empty decks
    expect(screen.getByText("No decks available yet. The card will be added to your Arsenal.")).toBeInTheDocument();

    // Toggle creating new deck
    const newDeckBtn = screen.getByRole("button", { name: /create new deck/i });
    fireEvent.click(newDeckBtn);

    const newDeckInput = screen.getByPlaceholderText(/enter new deck name/i);
    fireEvent.change(newDeckInput, { target: { value: "Failed Deck" } });

    // Submit
    const submitBtn = screen.getByRole("button", { name: /create flashcard/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateCard).toHaveBeenCalledWith(
        {
          jpText: "月 (つき)\n\n「月が綺麗。」",
          enText: "moon",
        },
        undefined
      );
    });
  });
});
