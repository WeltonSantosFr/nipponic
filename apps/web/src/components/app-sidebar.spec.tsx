import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  SidebarNoteItem,
  SidebarMyDeckItem,
  SidebarRemoteDeckItem,
} from "./app-sidebar";
import { SidebarProvider, SidebarMenu } from "@/components/ui/sidebar";
import { normalizeDeckName, type Note, type Deck } from "@nipponic/shared";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderWithSidebar(ui: React.ReactElement) {
  return render(
    <SidebarProvider>
      <SidebarMenu>{ui}</SidebarMenu>
    </SidebarProvider>
  );
}

describe("normalizeDeckName", () => {
  it("normalizes casing, whitespace, and diacritics", () => {
    expect(normalizeDeckName("  Vocabulário N5  ")).toBe("vocabulario n5");
  });

  it("normalizes pt aliases 'básico' and 'avançado' to English 'basic' and 'advanced'", () => {
    expect(normalizeDeckName("Japonês Básico")).toBe("japones basic");
    expect(normalizeDeckName("Kanji Avançado")).toBe("kanji advanced");
  });

  it("handles empty or falsy strings gracefully", () => {
    expect(normalizeDeckName("")).toBe("");
  });
});

describe("SidebarNoteItem", () => {
  const mockNote: Note = {
    id: "note-1",
    title: "Kanji Practice",
    enText: "Practice Kanji",
    jpText: "漢字の練習",
    sourceLang: "EN",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("renders note title and triggers onSelect when clicked", () => {
    const handleSelect = vi.fn();
    const handleDelete = vi.fn();

    renderWithSidebar(
      <SidebarNoteItem
        note={mockNote}
        isSelected={false}
        onSelect={handleSelect}
        onDeleteRequest={handleDelete}
      />
    );

    expect(screen.getByText("Kanji Practice")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Kanji Practice"));
    expect(handleSelect).toHaveBeenCalledWith("note-1");
  });

  it("falls back to Untitled Note when title is empty", () => {
    const emptyNote: Note = { ...mockNote, title: "" };

    renderWithSidebar(
      <SidebarNoteItem
        note={emptyNote}
        isSelected={false}
        onSelect={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    expect(screen.getByText("Untitled Note")).toBeInTheDocument();
  });

  it("calls onDeleteRequest when delete action button is clicked", () => {
    const handleDelete = vi.fn();

    renderWithSidebar(
      <SidebarNoteItem
        note={mockNote}
        isSelected={false}
        onSelect={vi.fn()}
        onDeleteRequest={handleDelete}
      />
    );

    const deleteBtn = screen.getByTitle("Delete note");
    fireEvent.click(deleteBtn);
    expect(handleDelete).toHaveBeenCalledWith(mockNote);
  });
});

describe("SidebarMyDeckItem", () => {
  const mockDeckWithDue: Deck = {
    id: "deck-1",
    name: "JLPT N5 Core",
    isPublic: false,
    cards: [
      {
        id: "c1",
        jpText: "本",
        enText: "Book",
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        lapses: 0,
        nextReviewAt: "2020-01-01T00:00:00.000Z", // Past date => due
        lastReviewedAt: null,
        createdAt: "2020-01-01T00:00:00.000Z",
        updatedAt: "2020-01-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("renders deck name and displays due count badge", () => {
    renderWithSidebar(
      <SidebarMyDeckItem
        deck={mockDeckWithDue}
        isSelected={false}
        onSelect={vi.fn()}
        onPlay={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    expect(screen.getByText("JLPT N5 Core")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // dueCount badge
  });

  it("triggers play and delete requests when respective buttons clicked", () => {
    const handlePlay = vi.fn();
    const handleDelete = vi.fn();
    const handleSelect = vi.fn();

    renderWithSidebar(
      <SidebarMyDeckItem
        deck={mockDeckWithDue}
        isSelected={false}
        onSelect={handleSelect}
        onPlay={handlePlay}
        onDeleteRequest={handleDelete}
      />
    );

    fireEvent.click(screen.getByTitle("Play due cards (1 due)"));
    expect(handlePlay).toHaveBeenCalledWith(mockDeckWithDue);

    fireEvent.click(screen.getByTitle("Delete deck"));
    expect(handleDelete).toHaveBeenCalledWith(mockDeckWithDue);

    fireEvent.click(screen.getByText("JLPT N5 Core"));
    expect(handleSelect).toHaveBeenCalledWith("deck-1");
  });
});

describe("SidebarRemoteDeckItem", () => {
  const mockRemoteDeck: Deck = {
    id: "remote-1",
    name: "Kana Mastery",
    isPublic: true,
    cards: [
      {
        id: "c1",
        jpText: "あ",
        enText: "a",
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        lapses: 0,
        nextReviewAt: "2026-01-01T00:00:00.000Z",
        lastReviewedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("shows 'Added' badge when isAlreadyAdded is true", () => {
    renderWithSidebar(
      <SidebarRemoteDeckItem
        deck={mockRemoteDeck}
        isSelected={false}
        isAlreadyAdded={true}
        isCloning={false}
        isPublic={true}
        onSelect={vi.fn()}
        onAddDeck={vi.fn()}
      />
    );

    expect(screen.getByText("Kana Mastery")).toBeInTheDocument();
    expect(screen.getByText("Added")).toBeInTheDocument();
    expect(screen.queryByTitle("Add to My Decks")).toBeNull();
  });

  it("shows 'Add to My Decks' button when not added and invokes onAddDeck", () => {
    const handleAdd = vi.fn();

    renderWithSidebar(
      <SidebarRemoteDeckItem
        deck={mockRemoteDeck}
        isSelected={false}
        isAlreadyAdded={false}
        isCloning={false}
        isPublic={true}
        onSelect={vi.fn()}
        onAddDeck={handleAdd}
      />
    );

    const addBtn = screen.getByTitle("Add to My Decks");
    expect(addBtn).toBeInTheDocument();
    fireEvent.click(addBtn);
    expect(handleAdd).toHaveBeenCalledWith(mockRemoteDeck);
  });
});
