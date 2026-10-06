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

describe("TextEditor Field Editability by Direction", () => {
  it("when EN -> JA, renders English field as editable textarea by default, without Done button, and triggers onBlurContent", () => {
    const mockEnNote: Note = {
      id: "note-en-to-jp",
      title: "EN Note",
      enText: "Hello there",
      jpText: "こんにちは",
      sourceLang: "EN",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const handleBlurContent = vi.fn();

    render(
      <TextEditor
        selectedNote={mockEnNote}
        onChangeContent={vi.fn()}
        onBlurContent={handleBlurContent}
        onTranslate={vi.fn()}
        isTranslating={false}
      />
    );

    // English source field is editable by default
    const enTextarea = screen.getByPlaceholderText("Start typing in English...");
    expect(enTextarea).toBeInTheDocument();
    expect(enTextarea).toHaveValue("Hello there");

    // There should NOT be a "Done" button in source
    expect(screen.queryByRole("button", { name: /^done$/i })).not.toBeInTheDocument();

    // Trigger blur on English textarea
    fireEvent.blur(enTextarea);
    expect(handleBlurContent).toHaveBeenCalledTimes(1);

    // Japanese target field is not a textarea by default (TokenizedText is rendered)
    expect(
      screen.queryByPlaceholderText("Type or adjust Japanese text...")
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("tokenized-text")).toBeInTheDocument();

    // Edit button for Japanese target is available
    expect(screen.getByRole("button", { name: /edit japanese/i })).toBeInTheDocument();
  });

  it("when JA -> EN, renders Japanese field as editable textarea without Done button and triggers onBlurJpContent on blur", () => {
    const mockJaNote: Note = {
      id: "note-ja-to-en",
      title: "JA Note",
      enText: "Hello there",
      jpText: "こんにちは",
      sourceLang: "JA",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const handleBlurJpContent = vi.fn();
    const handleChangeJpContent = vi.fn();

    render(
      <TextEditor
        selectedNote={mockJaNote}
        onChangeContent={vi.fn()}
        onChangeJpContent={handleChangeJpContent}
        onBlurJpContent={handleBlurJpContent}
        onTranslate={vi.fn()}
        isTranslating={false}
      />
    );

    // Japanese source field is editable textarea directly
    const jpTextarea = screen.getByPlaceholderText(
      "Start typing in Japanese (日本語で入力)..."
    );
    expect(jpTextarea).toBeInTheDocument();
    expect(jpTextarea).toHaveValue("こんにちは");

    // There should NOT be a "Done" or "Edit Japanese" button in source
    expect(screen.queryByRole("button", { name: /^done$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /edit japanese/i })).not.toBeInTheDocument();

    // Trigger blur on Japanese textarea to verify save on blur
    fireEvent.blur(jpTextarea);
    expect(handleBlurJpContent).toHaveBeenCalledTimes(1);

    // English target field is not a textarea by default
    expect(
      screen.queryByPlaceholderText("Type or adjust English translation...")
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit english/i })).toBeInTheDocument();
  });
});
