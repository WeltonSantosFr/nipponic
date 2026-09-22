import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FlashcardPlayer } from "./flashcard-player";
import { Deck, Card } from "@nipponic/shared";

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

const mockReviewCard = vi.fn().mockImplementation((cardId: string, rating: number) => {
  return Promise.resolve({
    id: cardId,
    repetitions: rating === 1 ? 0 : 1,
    interval: rating === 1 ? 1 : 3,
    easeFactor: 2.5,
    lapses: 0,
  });
});

vi.mock("@/contexts/FlashCardsContext", () => ({
  useFlashCards: () => ({
    reviewCard: mockReviewCard,
  }),
}));

const mockSpeak = vi.fn();
const mockStop = vi.fn();

vi.mock("@/hooks/use-speech", () => ({
  useSpeech: () => ({
    speak: mockSpeak,
    stop: mockStop,
    isPlaying: false,
  }),
}));

describe("FlashcardPlayer", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state with responsive padding when deck has no cards", () => {
    const emptyDeck: Deck = {
      id: "deck-empty",
      name: "Empty Deck",
      isPublic: false,
      cards: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <FlashcardPlayer deck={emptyDeck} onClose={mockOnClose} />
    );

    expect(screen.getByText("This deck is empty")).toBeInTheDocument();
    expect(screen.getByText(/Add cards to "Empty Deck"/i)).toBeInTheDocument();

    // Verify outer container has mobile-optimized padding classes and does not have raw p-safe wiping padding out
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay.className).toContain("px-4");
    expect(overlay.className).toContain("sm:px-6");
    expect(overlay.className).not.toMatch(/\bp-safe\b/);

    fireEvent.click(screen.getByRole("button", { name: /back to deck/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("renders active card player with responsive padding and displays prompt on front face", () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "猫 (ねこ)",
        enText: "Cat",
        repetitions: 2,
        interval: 3,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const deck: Deck = {
      id: "deck-1",
      name: "Animals",
      isPublic: false,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { container } = render(
      <FlashcardPlayer deck={deck} onClose={mockOnClose} />
    );

    // Verify outer overlay classes ensure space on mobile (320px to 560px)
    const overlay = container.firstElementChild as HTMLElement;
    expect(overlay.className).toContain("px-4");
    expect(overlay.className).toContain("sm:px-6");
    expect(overlay.className).not.toMatch(/\bp-safe\b/);

    // Front content
    expect(screen.getByText("猫 (ねこ)")).toBeInTheDocument();
    expect(screen.getByText("Prompt (Japanese)")).toBeInTheDocument();
    expect(screen.getByText("Streak: 2")).toBeInTheDocument();
    expect(screen.queryByText("Cat")).not.toBeInTheDocument();
  });

  it("flips card to reveal translation and SRS rating buttons on click", () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "桜 (さくら)",
        enText: "Cherry blossom",
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const deck: Deck = {
      id: "deck-1",
      name: "Nature",
      isPublic: false,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);

    // Click card to flip
    const cardContent = screen.getByText("桜 (さくら)");
    fireEvent.click(cardContent);

    // Back content
    expect(screen.getByText("Cherry blossom")).toBeInTheDocument();
    expect(screen.getByText("Meaning / Context")).toBeInTheDocument();

    // SRS buttons visible
    expect(screen.getByRole("button", { name: /again/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /hard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /good/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /easy/i })).toBeInTheDocument();
  });

  it("handles rating selection and completes session when last card is answered", async () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "犬 (いぬ)",
        enText: "Dog",
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const deck: Deck = {
      id: "deck-1",
      name: "Animals",
      isPublic: false,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);

    // Flip card
    fireEvent.click(screen.getByText("犬 (いぬ)"));

    // Rate card as Good (3)
    const goodButton = screen.getByRole("button", { name: /good/i });
    fireEvent.click(goodButton);

    await waitFor(() => {
      expect(mockReviewCard).toHaveBeenCalledWith("c-1", 3);
    });

    // Expect victory screen
    await waitFor(() => {
      expect(screen.getByText(/Session Complete!/i)).toBeInTheDocument();
      expect(screen.getByText("Finish")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /finish/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("supports keyboard navigation: Space to flip and 3 to rate Good", async () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "本 (ほん)",
        enText: "Book",
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const deck: Deck = {
      id: "deck-1",
      name: "Objects",
      isPublic: false,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);

    // Press Space to flip
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText("Book")).toBeInTheDocument();

    // Press 3 to rate Good
    fireEvent.keyDown(window, { key: "3" });

    await waitFor(() => {
      expect(mockReviewCard).toHaveBeenCalledWith("c-1", 3);
    });

    await waitFor(() => {
      expect(screen.getByText(/Session Complete!/i)).toBeInTheDocument();
    });
  });
});
