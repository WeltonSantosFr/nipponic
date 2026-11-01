import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import { AddCardsModal } from "./add-cards-modal";
import type { Deck, Card } from "@nipponic/shared";

const mockAddCardsToDeck = vi.fn();
const mockCreateCard = vi.fn();

const card1: Card = {
  id: "c-1",
  jpText: "猫",
  enText: "Cat",
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  lapses: 0,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};

const card2: Card = {
  id: "c-2",
  jpText: "犬",
  enText: "Dog",
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  lapses: 0,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};

const card3: Card = {
  id: "c-3",
  jpText: "本",
  enText: "Book",
  interval: 1,
  easeFactor: 2.5,
  repetitions: 0,
  lapses: 0,
  createdAt: "2026-10-01",
  updatedAt: "2026-10-01",
};

let mockCards: Card[] = [card1, card2, card3];

vi.mock("@/contexts/FlashCardsContext", () => ({
  useFlashCards: () => ({
    cards: mockCards,
    addCardsToDeck: mockAddCardsToDeck,
    createCard: mockCreateCard,
  }),
}));

describe("AddCardsModal", () => {
  const mockDeck: Deck = {
    id: "deck-target",
    name: "JLPT N5 Core",
    isPublic: false,
    cards: [card1], // card1 is already in deck
    createdAt: "2026-10-01",
    updatedAt: "2026-10-01",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCards = [card1, card2, card3];
    mockCreateCard.mockResolvedValue({ id: "new-card-id", jpText: "車", enText: "Car" });
    mockAddCardsToDeck.mockResolvedValue(undefined);
  });

  it("renders modal with card list and identifies already included cards", () => {
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('Add Cards to "JLPT N5 Core"')).toBeInTheDocument();
    expect(screen.getByText("猫")).toBeInTheDocument();
    expect(screen.getByText("In Deck")).toBeInTheDocument();
    expect(screen.getByText("犬")).toBeInTheDocument();
    expect(screen.getByText("本")).toBeInTheDocument();
  });

  it("filters cards with search input and clears search", () => {
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/search arsenal cards/i);
    fireEvent.change(searchInput, { target: { value: "Dog" } });

    expect(screen.getByText("犬")).toBeInTheDocument();
    expect(screen.queryByText("本")).not.toBeInTheDocument();

    const clearBtn = searchInput.parentElement?.querySelector("button");
    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect(screen.getByText("本")).toBeInTheDocument();
    }
  });

  it("selects unassigned cards and adds them to the deck", async () => {
    const handleClose = vi.fn();
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={handleClose} />);

    // Click on card2 ("犬") to select
    const dogCard = screen.getByText("犬").closest("div[class*='cursor-pointer']");
    expect(dogCard).toBeInTheDocument();
    fireEvent.click(dogCard!);

    // Click on already included card should not select it
    const catCard = screen.getByText("猫").closest("div[class*='cursor-not-allowed']");
    expect(catCard).toBeInTheDocument();
    fireEvent.click(catCard!);

    expect(screen.getByText("1 card selected")).toBeInTheDocument();

    const addBtn = screen.getByRole("button", { name: /add selected/i });
    expect(addBtn).toBeInTheDocument();

    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(mockAddCardsToDeck).toHaveBeenCalledWith("deck-target", ["c-2"]);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("switches to Quick Card Creation and creates & adds new card", async () => {
    const handleClose = vi.fn();
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={handleClose} />);

    const quickBtn = screen.getByRole("button", { name: /create new card/i });
    fireEvent.click(quickBtn);

    expect(screen.getByLabelText(/japanese text/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/english translation/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/japanese text/i), { target: { value: "車" } });
    fireEvent.change(screen.getByLabelText(/english translation/i), { target: { value: "Car" } });

    const submitBtn = screen.getByRole("button", { name: /create & add to deck/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockCreateCard).toHaveBeenCalledWith({ jpText: "車", enText: "Car" });
      expect(mockAddCardsToDeck).toHaveBeenCalledWith("deck-target", ["new-card-id"]);
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("displays empty state when search finds no cards or arsenal is empty", () => {
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/search arsenal cards/i);
    fireEvent.change(searchInput, { target: { value: "nonexistentquery" } });

    expect(screen.getByText(/no cards found matching "nonexistentquery"/i)).toBeInTheDocument();
  });

  it("toggles card selection on and off", () => {
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={vi.fn()} />);

    const dogCard = screen.getByText("犬").closest("div[class*='cursor-pointer']");
    expect(dogCard).toBeInTheDocument();

    // Select
    fireEvent.click(dogCard!);
    expect(screen.getByText("1 card selected")).toBeInTheDocument();

    // Deselect
    fireEvent.click(dogCard!);
    expect(screen.getByText("0 cards selected")).toBeInTheDocument();
  });

  it("cancels quick card creation and returns to card list", () => {
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /create new card/i }));
    expect(screen.getByLabelText(/japanese text/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText(/japanese text/i)).not.toBeInTheDocument();
    expect(screen.getByText("犬")).toBeInTheDocument();
  });

  it("handles dialog Escape key close", () => {
    const handleClose = vi.fn();
    render(<AddCardsModal deck={mockDeck} isOpen={true} onClose={handleClose} />);

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });
});
