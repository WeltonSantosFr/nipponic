import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FlashcardPlayer } from "./flashcard-player";
import { Deck, Card } from "@nipponic/shared";

const mockConfetti = vi.fn();
vi.mock("canvas-confetti", () => ({
  default: (...args: any[]) => mockConfetti(...args),
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

let mockSpeechState = {
  speak: mockSpeak,
  stop: mockStop,
  isPlaying: false,
  isLoading: false,
};

vi.mock("@/hooks/use-speech", () => ({
  useSpeech: () => mockSpeechState,
}));

describe("FlashcardPlayer", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSpeechState = {
      speak: mockSpeak,
      stop: mockStop,
      isPlaying: false,
      isLoading: false,
    };
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

  it("changes pronunciation speed and plays audio", () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "本",
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

    // Change speed to 1.25x
    const speedBtn = screen.getByRole("button", { name: "1.25x" });
    fireEvent.click(speedBtn);

    // Click pronounce button
    const pronounceBtn = screen.getByTitle("Pronounce at 1.25x");
    fireEvent.click(pronounceBtn);
    expect(mockSpeak).toHaveBeenCalledWith("本", "ja-JP", 1.25);
  });

  it("handles Rating 1 (Again) by adding the card back to the session queue", async () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "難しい",
        enText: "Difficult",
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
      name: "Adjectives",
      isPublic: false,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);

    // Flip card
    fireEvent.click(screen.getByText("難しい"));

    // Rate Again (1)
    const againBtn = screen.getByRole("button", { name: /again/i });
    fireEvent.click(againBtn);

    expect(mockReviewCard).toHaveBeenCalledWith("c-1", 1);

    // Card should appear again in queue instead of immediate session completion
    await waitFor(() => {
      expect(screen.getByText("Difficult")).toBeInTheDocument();
    });
  });

  it("supports keyboard navigation: Space to flip, 3 to rate Good, and Escape to close", async () => {
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

    // Press Escape to cancel play
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("pronounces Japanese from the back side and handles Hard and Easy ratings via buttons and keyboard", async () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "猫",
        enText: "Cat",
        repetitions: 1,
        interval: 3,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "c-2",
        jpText: "犬",
        enText: "Dog",
        repetitions: 3,
        interval: 10,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "c-3",
        jpText: "鳥",
        enText: "Bird",
        repetitions: 5,
        interval: 25,
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

    // Stage badge for learning
    expect(screen.getByText("Learning")).toBeInTheDocument();

    // Flip card 1
    fireEvent.click(screen.getByText("猫"));
    expect(screen.getByText("Cat")).toBeInTheDocument();

    // Pronounce Japanese from back side
    const pronounceBackBtn = screen.getByTitle("Pronounce Japanese");
    fireEvent.click(pronounceBackBtn);
    expect(mockSpeak).toHaveBeenCalledWith("猫", "ja-JP", 1);

    // Rate Hard (2) via button
    fireEvent.click(screen.getByRole("button", { name: /hard/i }));
    expect(mockReviewCard).toHaveBeenCalledWith("c-1", 2);

    // Card 2 is now active (Review stage)
    await waitFor(() => {
      expect(screen.getByText("Review")).toBeInTheDocument();
      expect(screen.getByText("犬")).toBeInTheDocument();
    });

    // Flip card 2 via Space and rate Easy (4) via keyboard '4'
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText("Dog")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "4" });
    expect(mockReviewCard).toHaveBeenCalledWith("c-2", 4);

    // Card 3 is now active (Mastered stage)
    await waitFor(() => {
      expect(screen.getByText("Mastered")).toBeInTheDocument();
      expect(screen.getByText("鳥")).toBeInTheDocument();
    });

    // Flip card 3 and rate Good (3) via button
    fireEvent.click(screen.getByText("鳥"));
    fireEvent.click(screen.getByRole("button", { name: /good/i }));

    // Reaches Victory screen
    await waitFor(() => {
      expect(screen.getByText("Session Complete! 🎉")).toBeInTheDocument();
    });

    // Test Review Again on Victory Screen
    const reviewAgainBtn = screen.getByRole("button", { name: /Review Again/i });
    fireEvent.click(reviewAgainBtn);

    // Back to active session with first card
    await waitFor(() => {
      expect(screen.getByText("猫")).toBeInTheDocument();
    });
  });

  it("closes modal from Victory screen and active player close buttons", async () => {
    const cards: Card[] = [
      {
        id: "c-1",
        jpText: "車",
        enText: "Car",
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
      name: "Vehicles",
      isPublic: false,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { rerender } = render(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);

    // Active player close button
    const closeBtn = screen.getByTitle("Cancel play (Esc)");
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Complete session to reach Victory screen
    fireEvent.click(screen.getByText("車"));
    fireEvent.click(screen.getByRole("button", { name: /easy/i }));

    await waitFor(() => {
      expect(screen.getByText("Session Complete! 🎉")).toBeInTheDocument();
    });

    // Victory screen Finish button
    fireEvent.click(screen.getByRole("button", { name: /Finish/i }));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });

  it("supports keyboard navigation shortcuts: Enter to flip, '1', '2', '3' for ratings", async () => {
    const cards: Card[] = [
      {
        id: "c-kb-1",
        jpText: "一",
        enText: "One",
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "c-kb-2",
        jpText: "二",
        enText: "Two",
        repetitions: 0,
        interval: 1,
        easeFactor: 2.5,
        lapses: 0,
        nextReviewAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "c-kb-3",
        jpText: "三",
        enText: "Three",
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
      id: "deck-kb",
      name: "Numbers",
      isPublic: false,
      cards,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);

    // Flip via Enter key
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByText("One")).toBeInTheDocument();

    // Rate Hard (2) via '2' key
    fireEvent.keyDown(window, { key: "2" });
    expect(mockReviewCard).toHaveBeenCalledWith("c-kb-1", 2);

    // Card 2: Flip via Space key and rate Good (3) via '3' key
    await waitFor(() => {
      expect(screen.getByText("二")).toBeInTheDocument();
    });
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByText("Two")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "3" });
    expect(mockReviewCard).toHaveBeenCalledWith("c-kb-2", 3);

    // Card 3: Flip via Enter key and rate Again (1) via '1' key
    await waitFor(() => {
      expect(screen.getByText("三")).toBeInTheDocument();
    });
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByText("Three")).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "1" });
    expect(mockReviewCard).toHaveBeenCalledWith("c-kb-3", 1);
  });

  it("handles confetti error gracefully on session completion", async () => {
    mockConfetti.mockImplementation(() => {
      throw new Error("Confetti failed");
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const cards: Card[] = [
      {
        id: "c-err-1",
        jpText: "猫",
        enText: "Cat",
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

    fireEvent.click(screen.getByText("猫"));
    fireEvent.click(screen.getByRole("button", { name: /easy/i }));

    await waitFor(() => {
      expect(screen.getByText("Session Complete! 🎉")).toBeInTheDocument();
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      "Confetti trigger error:",
      expect.any(Error)
    );
    consoleSpy.mockRestore();
  });

  it("stops audio playback when clicked while audio is playing and handles speech loading state", () => {
    mockSpeechState = {
      speak: mockSpeak,
      stop: mockStop,
      isPlaying: true,
      isLoading: false,
    };

    const cards: Card[] = [
      {
        id: "c-audio-1",
        jpText: "犬",
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

    const { rerender } = render(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);

    // Front face: Click pronounce button while isPlaying
    const frontPronounceBtn = screen.getByTitle("Pronounce at 1x");
    fireEvent.click(frontPronounceBtn);
    expect(mockStop).toHaveBeenCalledTimes(1);

    // Now test isLoading state
    mockSpeechState = {
      speak: mockSpeak,
      stop: mockStop,
      isPlaying: false,
      isLoading: true,
    };

    rerender(<FlashcardPlayer deck={deck} onClose={mockOnClose} />);
    expect(frontPronounceBtn).toBeDisabled();
  });

  it("flips card back to front when clicked again", () => {
    const cards: Card[] = [
      {
        id: "c-flip-1",
        jpText: "山",
        enText: "Mountain",
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

    // Click to flip to back
    fireEvent.click(screen.getByText("山"));
    expect(screen.getByText("Mountain")).toBeInTheDocument();
    expect(screen.getByText("Tap card to flip back")).toBeInTheDocument();

    // Click to flip back to front
    fireEvent.click(screen.getByText("Mountain"));
    expect(screen.getByText("山")).toBeInTheDocument();
    expect(screen.getByText("Tap card to reveal answer")).toBeInTheDocument();
  });
});
