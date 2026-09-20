import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TextEditor } from "./text-editor";
import type { Note } from "@nipponic/shared";

// Mock child components and hooks that aren't under test
vi.mock("@/hooks/use-speech", () => ({
  useSpeech: () => ({
    speak: vi.fn(),
    stop: vi.fn(),
    isPlaying: false,
    activeLang: null,
  }),
}));

vi.mock("@/components/tokenized-text", () => ({
  TokenizedText: () => <div data-testid="tokenized-text" />,
}));

vi.mock("@/components/glossary-modal", () => ({
  GlossaryModal: () => <div data-testid="glossary-modal" />,
}));

vi.mock("@/components/shadowing-modal", () => ({
  ShadowingModal: () => <div data-testid="shadowing-modal" />,
}));

const mockNote: Note = {
  id: "test-note-1",
  title: "Test Note",
  enText: "Hello world",
  jpText: "こんにちは世界",
  sourceLang: "EN",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("TextEditor Header Layout", () => {
  it("renders header with responsive flex-wrap classes", () => {
    const handleTranslate = vi.fn();
    const handleChangeSourceLang = vi.fn();

    const { container } = render(
      <TextEditor
        selectedNote={mockNote}
        onChangeContent={vi.fn()}
        onTranslate={handleTranslate}
        onChangeSourceLang={handleChangeSourceLang}
        isTranslating={false}
      />
    );

    // The header container should have flex-wrap enabled for responsive wrapping at 768px
    const header = container.querySelector(".border-b");
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass("flex");
    expect(header).toHaveClass("sm:flex-wrap");
    expect(header).toHaveClass("justify-between");

    // Both Glossary and Translate buttons should be present
    expect(screen.getByRole("button", { name: /glossary/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /translate/i })).toBeInTheDocument();
  });

  it("triggers onTranslate when clicking translate button", () => {
    const handleTranslate = vi.fn();

    render(
      <TextEditor
        selectedNote={mockNote}
        onChangeContent={vi.fn()}
        onTranslate={handleTranslate}
        isTranslating={false}
      />
    );

    const translateBtn = screen.getByRole("button", { name: /translate/i });
    expect(translateBtn).not.toBeDisabled();
    fireEvent.click(translateBtn);

    expect(handleTranslate).toHaveBeenCalledTimes(1);
  });
});
