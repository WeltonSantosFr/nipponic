import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SentenceMinerModal } from "./sentence-miner-modal";

const mockCreateCard = vi.fn().mockResolvedValue({ id: "new-card-1" });
const mockCreateDeck = vi.fn().mockResolvedValue({ id: "new-deck-1", name: "Custom Deck", cards: [] });
const mockOnClose = vi.fn();

const mockDecks = [
  { id: "deck-1", name: "JLPT N5", cards: [{ id: "c1" }] },
  { id: "deck-2", name: "Anime Vocab", cards: [] },
];

vi.mock("@/contexts/FlashCardsContext", () => ({
  useFlashCards: () => ({
    decks: mockDecks,
    createCard: mockCreateCard,
    createDeck: mockCreateDeck,
    selectedDeckId: "deck-1",
  }),
}));

describe("SentenceMinerModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it("submits the card with definition-only back to the selected deck", async () => {
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
    });
  });

  it("allows creating a new deck directly from the modal", async () => {
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
});
