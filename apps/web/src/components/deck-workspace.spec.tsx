import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeckCardGridItem, DeckWorkspace } from "./deck-workspace";
import * as FlashCardsContextModule from "@/contexts/FlashCardsContext";
import type { Card, Deck, FlashCardsContextData } from "@nipponic/shared";

describe("DeckCardGridItem", () => {
  const mockCard: Card = {
    id: "card-123",
    jpText: "猫",
    enText: "Cat",
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    nextReviewAt: "2026-01-01T00:00:00.000Z",
    lastReviewedAt: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("renders card content and handles translation toggle with card id", () => {
    const handleToggleReveal = vi.fn();
    const handleMoveCard = vi.fn();
    const handleRemoveCard = vi.fn();
    const handleSpeak = vi.fn();

    const { rerender } = render(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={3}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    expect(screen.getByText("猫")).toBeInTheDocument();
    expect(screen.getByText("Reveal translation")).toBeInTheDocument();

    // Toggle reveal button should pass card id
    fireEvent.click(screen.getByText("Reveal translation"));
    expect(handleToggleReveal).toHaveBeenCalledWith("card-123");

    // Re-render as revealed
    rerender(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={3}
        isRevealed={true}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    expect(screen.getByText("Cat")).toBeInTheDocument();
    expect(screen.getByText("Hide translation")).toBeInTheDocument();
  });

  it("triggers move right and remove callbacks with stable parameters", () => {
    const handleToggleReveal = vi.fn();
    const handleMoveCard = vi.fn();
    const handleRemoveCard = vi.fn();
    const handleSpeak = vi.fn();

    render(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={3}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    // Left button should be disabled for first item (index 0)
    const moveLeftBtn = screen.getByTitle("Move left/up");
    expect(moveLeftBtn).toBeDisabled();

    // Move right button should trigger onMoveCard(0, "right")
    const moveRightBtn = screen.getByTitle("Move right/down");
    fireEvent.click(moveRightBtn);
    expect(handleMoveCard).toHaveBeenCalledWith(0, "right");

    // Remove button should trigger onRemoveCard("card-123")
    const removeBtn = screen.getByTitle("Remove from deck");
    fireEvent.click(removeBtn);
    expect(handleRemoveCard).toHaveBeenCalledWith("card-123");
  });

  it("handles audio playback triggering onSpeak and reflects isPlaying status", () => {
    const handleSpeak = vi.fn();
    const handleToggleReveal = vi.fn();
    const handleMoveCard = vi.fn();
    const handleRemoveCard = vi.fn();

    const { rerender } = render(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={1}
        isRevealed={false}
        isOwner={true}
        isPlaying={false}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    const playBtn = screen.getByTitle("Listen to pronunciation");
    fireEvent.click(playBtn);
    expect(handleSpeak).toHaveBeenCalledWith("猫", "ja-JP");

    // When card is actively playing
    rerender(
      <DeckCardGridItem
        card={mockCard}
        index={0}
        total={1}
        isRevealed={false}
        isOwner={true}
        isPlaying={true}
        onSpeak={handleSpeak}
        onToggleReveal={handleToggleReveal}
        onMoveCard={handleMoveCard}
        onRemoveCard={handleRemoveCard}
      />
    );

    expect(screen.getByTitle("Listen to pronunciation")).toBeDisabled();
  });
});

describe("DeckWorkspace", () => {
  const mockSetSelectedDeckId = vi.fn();
  const mockCreateDeck = vi.fn();
  const mockUpdateDeck = vi.fn();

  const mockDeck: Deck = {
    id: "deck-123",
    name: "Test Vocabulary",
    cards: [],
    isPublic: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const createMockFlashcards = (
    overrides: Partial<FlashCardsContextData> = {}
  ): FlashCardsContextData => ({
    cards: [],
    decks: [mockDeck],
    appDecks: [],
    publicDecks: [],
    activeDeckTab: "my",
    setActiveDeckTab: vi.fn(),
    selectedDeckId: "deck-123",
    selectedDeck: mockDeck,
    isCurrentDeckOwner: true,
    setSelectedDeckId: mockSetSelectedDeckId,
    activeSidebarView: "flashcards",
    setActiveSidebarView: vi.fn(),
    playingDeck: null,
    startPlayingDeck: vi.fn(),
    stopPlayingDeck: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    reviewCard: vi.fn(),
    getDueCards: () => [],
    createDeck: mockCreateDeck,
    updateDeck: mockUpdateDeck,
    deleteDeck: vi.fn(),
    addCardsToDeck: vi.fn(),
    removeCardFromDeck: vi.fn(),
    reorderDeckCards: vi.fn(),
    addDeckToMyDecks: vi.fn(),
    refreshAll: vi.fn(),
    studyStats: null,
    refreshStats: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state notice when deck is undefined and decks.length === 0", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [] })
    );

    render(<DeckWorkspace deck={undefined} />);

    expect(screen.getByText("No deck selected")).toBeInTheDocument();
    expect(
      screen.getByText(/Select a deck from the sidebar or create a new pack/i)
    ).toBeInTheDocument();
  });

  it("renders DeckGrid when deck is undefined and decks.length > 0", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [mockDeck] })
    );

    render(<DeckWorkspace deck={undefined} />);

    expect(screen.getByTestId("decks-grid")).toBeInTheDocument();
    expect(screen.getByText("Test Vocabulary")).toBeInTheDocument();
  });

  it("renders Back to Decks button and resets selectedDeckId on click", () => {
    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(
      createMockFlashcards({ decks: [mockDeck], selectedDeck: mockDeck })
    );

    render(<DeckWorkspace deck={mockDeck} />);

    const backButton = screen.getByRole("button", { name: /Back to Decks/i });
    expect(backButton).toBeInTheDocument();

    fireEvent.click(backButton);
    expect(mockSetSelectedDeckId).toHaveBeenCalledWith(null);
  });
});

