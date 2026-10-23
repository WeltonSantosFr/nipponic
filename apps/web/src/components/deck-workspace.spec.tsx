import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DeckCardGridItem } from "./deck-workspace";
import type { Card } from "@nipponic/shared";

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
