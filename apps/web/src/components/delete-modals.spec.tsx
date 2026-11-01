import * as React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { DeleteDeckModal } from "./delete-deck-modal";
import { DeleteNoteModal } from "./delete-note-modal";
import { ThemeProvider } from "./theme-provider";
import type { Deck, Note } from "@nipponic/shared";

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
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

describe("Delete Modals and ThemeProvider", () => {
  describe("DeleteDeckModal", () => {
    const mockDeck: Deck = {
      id: "deck-del-1",
      name: "JLPT N5 Kanji",
      isPublic: false,
      cards: [],
      createdAt: "2026-10-01T00:00:00Z",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    it("returns null when deck is null or undefined", () => {
      const { container } = render(
        <DeleteDeckModal
          deck={null as any}
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders modal with deck name and handles cancel", () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      render(
        <DeleteDeckModal
          deck={mockDeck}
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText("Delete Deck", { selector: "h2, [data-slot=dialog-title]" })).toBeInTheDocument();
      expect(screen.getByText("JLPT N5 Kanji")).toBeInTheDocument();

      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelBtn);

      expect(handleClose).toHaveBeenCalledTimes(1);
      expect(handleConfirm).not.toHaveBeenCalled();
    });

    it("handles delete confirmation properly", () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      render(
        <DeleteDeckModal
          deck={mockDeck}
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      );

      const deleteBtn = screen.getByRole("button", { name: "Delete Deck" });
      fireEvent.click(deleteBtn);

      expect(handleConfirm).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it("handles closing on escape key press", () => {
      const handleClose = vi.fn();
      render(
        <DeleteDeckModal
          deck={mockDeck}
          isOpen={true}
          onClose={handleClose}
          onConfirm={vi.fn()}
        />
      );

      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("DeleteNoteModal", () => {
    const mockNote: Note = {
      id: "note-del-1",
      title: "Grammar Study Journal",
      enText: "English notes",
      jpText: "Japanese notes",
      sourceLang: "EN",
      updatedAt: "2026-10-01T00:00:00Z",
    };

    it("returns null when note is null or undefined", () => {
      const { container } = render(
        <DeleteNoteModal
          note={null as any}
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it("renders note title and Untitled Note fallback", () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      const { unmount } = render(
        <DeleteNoteModal
          note={mockNote}
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText('"Grammar Study Journal"')).toBeInTheDocument();
      unmount();

      const untitledNote = { ...mockNote, title: "" };
      render(
        <DeleteNoteModal
          note={untitledNote}
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      );

      expect(screen.getByText('"Untitled Note"')).toBeInTheDocument();
    });

    it("handles cancel and delete actions", () => {
      const handleClose = vi.fn();
      const handleConfirm = vi.fn();

      render(
        <DeleteNoteModal
          note={mockNote}
          isOpen={true}
          onClose={handleClose}
          onConfirm={handleConfirm}
        />
      );

      const cancelBtn = screen.getByRole("button", { name: "Cancel" });
      fireEvent.click(cancelBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);

      const deleteBtn = screen.getByRole("button", { name: /delete/i });
      fireEvent.click(deleteBtn);
      expect(handleConfirm).toHaveBeenCalledTimes(1);
    });

    it("handles closing on escape key press", () => {
      const handleClose = vi.fn();
      render(
        <DeleteNoteModal
          note={mockNote}
          isOpen={true}
          onClose={handleClose}
          onConfirm={vi.fn()}
        />
      );

      fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("ThemeProvider", () => {
    it("renders children wrapped in next-themes provider", () => {
      render(
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div data-testid="themed-child">App Content</div>
        </ThemeProvider>
      );

      expect(screen.getByTestId("themed-child")).toHaveTextContent("App Content");
    });
  });
});
