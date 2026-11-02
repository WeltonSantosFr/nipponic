import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { Workspace } from "./workspace";
import * as notesContextModule from "@/contexts/NotesContext";
import * as flashcardsContextModule from "@/contexts/FlashCardsContext";
import * as tutorContextModule from "@/contexts/TutorContext";
import * as glossaryModule from "@/services/glossary";

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

vi.mock("@/components/app-sidebar", () => ({
  AppSidebar: ({ onSelectNote }: any) => (
    <div data-testid="mock-app-sidebar">
      <span>Sidebar</span>
      <button onClick={() => onSelectNote("n99")}>Select n99</button>
    </div>
  ),
}));

vi.mock("@/components/bottom-navigation", () => ({
  BottomNavigation: () => <div data-testid="mock-bottom-nav">Bottom Nav</div>,
}));

let capturedEditorProps: any = null;

vi.mock("@/components/text-editor", () => ({
  TextEditor: (props: any) => {
    capturedEditorProps = props;
    return (
      <div data-testid="mock-text-editor">
        <span>Editor Note: {props.selectedNote.title}</span>
        <button onClick={() => props.onChangeContent("Updated EN")}>Change EN</button>
        <button onClick={() => props.onChangeJpContent("Updated JP")}>Change JP</button>
        <button onClick={() => props.onChangeSourceLang("JA")}>Change Lang</button>
        <button onClick={props.onTranslate}>Translate</button>
        <button onClick={props.onBlurContent}>Blur EN</button>
        <button onClick={props.onBlurJpContent}>Blur JP</button>
      </div>
    );
  },
}));

vi.mock("@/components/deck-workspace", () => ({
  DeckWorkspace: ({ deck }: any) => (
    <div data-testid="mock-deck-workspace">Deck: {deck?.name || "All Cards"}</div>
  ),
}));

vi.mock("@/components/tutor-workspace", () => ({
  TutorWorkspace: () => <div data-testid="mock-tutor-workspace">Tutor Workspace</div>,
}));

vi.mock("@/components/stats-workspace", () => ({
  StatsWorkspace: () => <div data-testid="mock-stats-workspace">Stats Workspace</div>,
}));

vi.mock("@/components/flashcard-player", () => ({
  FlashcardPlayer: ({ deck, onClose }: any) => (
    <div data-testid="mock-flashcard-player">
      <span>Playing: {deck.name}</span>
      <button onClick={onClose}>Stop Playing</button>
    </div>
  ),
}));

describe("Workspace Component", () => {
  const mockCreateNewNote = vi.fn().mockResolvedValue({ id: "note-new" });
  const mockUpdateNoteContent = vi.fn();
  const mockSaveNote = vi.fn().mockResolvedValue({});
  const mockSetSelectedNoteId = vi.fn();
  const mockSetSelectedDeckId = vi.fn();
  const mockStopPlayingDeck = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
      selectedNote: null,
      selectedNoteId: null,
      setSelectedNoteId: mockSetSelectedNoteId,
      createNewNote: mockCreateNewNote,
      updateNoteContent: mockUpdateNoteContent,
      saveNote: mockSaveNote,
    } as any);

    vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
      activeSidebarView: "notes",
      selectedDeck: null,
      setSelectedDeckId: mockSetSelectedDeckId,
      playingDeck: null,
      stopPlayingDeck: mockStopPlayingDeck,
    } as any);

    vi.spyOn(tutorContextModule, "useTutor").mockReturnValue({
      selectedLevel: "N3",
    } as any);

    vi.spyOn(glossaryModule, "getGlossaryRules").mockReturnValue([]);
  });

  describe("Notes View", () => {
    it("renders empty state when no note is selected and creates new note", async () => {
      render(<Workspace />);

      expect(screen.getByText("No note selected")).toBeInTheDocument();
      expect(
        screen.getByText("Select a note from the sidebar or create a new journal to start studying.")
      ).toBeInTheDocument();

      const createBtn = screen.getByRole("button", { name: "Create New Note" });
      await act(async () => {
        fireEvent.click(createBtn);
      });

      expect(mockCreateNewNote).toHaveBeenCalled();
    });

    it("renders selected note, allows title editing and auto-save on blur", async () => {
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n1",
          title: "My Grammar Journal",
          enText: "Hello",
          jpText: "こんにちは",
          sourceLang: "EN",
        },
        selectedNoteId: "n1",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      render(<Workspace />);

      // Title input
      const titleInput = screen.getByDisplayValue("My Grammar Journal");
      expect(titleInput).toBeInTheDocument();

      fireEvent.change(titleInput, { target: { value: "Updated Grammar Journal" } });
      expect(mockUpdateNoteContent).toHaveBeenCalledWith("n1", { title: "Updated Grammar Journal" });

      fireEvent.blur(titleInput);
      expect(mockSaveNote).toHaveBeenCalledWith("n1");

      await waitFor(() => {
        expect(screen.getByTestId("mock-text-editor")).toBeInTheDocument();
      });
    });

    it("handles note content and language updates from editor", async () => {
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n1",
          title: "Note 1",
          enText: "Hello",
          jpText: "こんにちは",
          sourceLang: "EN",
        },
        selectedNoteId: "n1",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      render(<Workspace />);

      await waitFor(() => {
        expect(screen.getByTestId("mock-text-editor")).toBeInTheDocument();
      });

      // Change EN
      fireEvent.click(screen.getByRole("button", { name: "Change EN" }));
      expect(mockUpdateNoteContent).toHaveBeenCalledWith("n1", { enText: "Updated EN" });

      // Change JP
      fireEvent.click(screen.getByRole("button", { name: "Change JP" }));
      expect(mockUpdateNoteContent).toHaveBeenCalledWith("n1", { jpText: "Updated JP" });

      // Change Lang
      fireEvent.click(screen.getByRole("button", { name: "Change Lang" }));
      expect(mockUpdateNoteContent).toHaveBeenCalledWith("n1", { sourceLang: "JA" });
      expect(mockSaveNote).toHaveBeenCalledWith("n1", { sourceLang: "JA" });

      // Blur EN
      fireEvent.click(screen.getByRole("button", { name: "Blur EN" }));
      expect(mockSaveNote).toHaveBeenCalledWith("n1");

      // Blur JP
      fireEvent.click(screen.getByRole("button", { name: "Blur JP" }));
      expect(mockSaveNote).toHaveBeenCalledWith("n1");
    });

    it("handles translation request via /api/translate", async () => {
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n1",
          title: "Note 1",
          enText: "Good morning",
          jpText: "",
          sourceLang: "EN",
        },
        selectedNoteId: "n1",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ translatedText: "おはようございます" }),
      } as any);

      render(<Workspace />);

      await waitFor(() => {
        expect(screen.getByTestId("mock-text-editor")).toBeInTheDocument();
      });

      const translateBtn = screen.getByRole("button", { name: "Translate" });
      await act(async () => {
        fireEvent.click(translateBtn);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/translate", expect.objectContaining({
        method: "POST",
      }));
      expect(mockUpdateNoteContent).toHaveBeenCalledWith("n1", { jpText: "おはようございます" });
      expect(mockSaveNote).toHaveBeenCalledWith("n1", { jpText: "おはようございます" });
    });

    it("handles translation from Japanese source to English target", async () => {
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n-ja",
          title: "Note JA",
          enText: "",
          jpText: "こんにちは",
          sourceLang: "JA",
        },
        selectedNoteId: "n-ja",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ translatedText: "Hello" }),
      } as any);

      render(<Workspace />);

      const translateBtn = screen.getByRole("button", { name: "Translate" });
      await act(async () => {
        fireEvent.click(translateBtn);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/translate", expect.objectContaining({
        body: expect.stringContaining('"sourceLang":"JA"'),
      }));
      expect(mockUpdateNoteContent).toHaveBeenCalledWith("n-ja", { enText: "Hello" });
      expect(mockSaveNote).toHaveBeenCalledWith("n-ja", { enText: "Hello" });
    });

    it("handles translation network failure gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n1",
          title: "Note 1",
          enText: "Fail test",
          jpText: "",
          sourceLang: "EN",
        },
        selectedNoteId: "n1",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      render(<Workspace />);

      const translateBtn = screen.getByRole("button", { name: "Translate" });
      await act(async () => {
        fireEvent.click(translateBtn);
      });

      expect(consoleSpy).toHaveBeenCalledWith("Error on translating:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("skips translation if source text is blank", async () => {
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n1",
          title: "Blank",
          enText: "   ",
          jpText: "",
          sourceLang: "EN",
        },
        selectedNoteId: "n1",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      global.fetch = vi.fn();

      render(<Workspace />);

      const translateBtn = screen.getByRole("button", { name: "Translate" });
      await act(async () => {
        fireEvent.click(translateBtn);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it("defaults sourceLang to EN when note.sourceLang is undefined", async () => {
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n-undef",
          title: "Undefined sourceLang",
          enText: "Good afternoon",
          jpText: "",
          sourceLang: undefined,
        },
        selectedNoteId: "n-undef",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ translatedText: "こんにちは" }),
      } as any);

      render(<Workspace />);

      const translateBtn = screen.getByRole("button", { name: "Translate" });
      await act(async () => {
        fireEvent.click(translateBtn);
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/translate", expect.objectContaining({
        body: expect.stringContaining('"sourceLang":"EN"'),
      }));
      expect(mockUpdateNoteContent).toHaveBeenCalledWith("n-undef", { jpText: "こんにちは" });
      expect(mockSaveNote).toHaveBeenCalledWith("n-undef", { jpText: "こんにちは" });
    });

    it("does not update note content if response translatedText is empty", async () => {
      vi.spyOn(notesContextModule, "useNotes").mockReturnValue({
        selectedNote: {
          id: "n1",
          title: "Empty translation result",
          enText: "Hello",
          jpText: "",
          sourceLang: "EN",
        },
        selectedNoteId: "n1",
        setSelectedNoteId: mockSetSelectedNoteId,
        createNewNote: mockCreateNewNote,
        updateNoteContent: mockUpdateNoteContent,
        saveNote: mockSaveNote,
      } as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ translatedText: "" }),
      } as any);

      render(<Workspace />);

      const translateBtn = screen.getByRole("button", { name: "Translate" });
      await act(async () => {
        fireEvent.click(translateBtn);
      });

      expect(mockUpdateNoteContent).not.toHaveBeenCalled();
      expect(mockSaveNote).not.toHaveBeenCalled();
    });
  });

  describe("Flashcards View", () => {
    it("renders cards workspace and header when activeSidebarView is flashcards", async () => {
      vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
        activeSidebarView: "flashcards",
        selectedDeck: null,
        setSelectedDeckId: mockSetSelectedDeckId,
        playingDeck: null,
        stopPlayingDeck: mockStopPlayingDeck,
      } as any);

      render(<Workspace />);

      expect(screen.getByText("Cards")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId("mock-deck-workspace")).toBeInTheDocument();
      });
    });

    it("renders selected deck breadcrumb and returns to all decks when clicked", async () => {
      vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
        activeSidebarView: "flashcards",
        selectedDeck: { id: "d1", name: "JLPT N5 Core" },
        setSelectedDeckId: mockSetSelectedDeckId,
        playingDeck: null,
        stopPlayingDeck: mockStopPlayingDeck,
      } as any);

      render(<Workspace />);

      expect(screen.getByText("JLPT N5 Core")).toBeInTheDocument();
      const backBtn = screen.getByTitle("Back to Decks");
      fireEvent.click(backBtn);

      expect(mockSetSelectedDeckId).toHaveBeenCalledWith(null);
    });
  });

  describe("Stats and Tutor Views", () => {
    it("renders stats workspace when activeSidebarView is stats", async () => {
      vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
        activeSidebarView: "stats",
        selectedDeck: null,
        setSelectedDeckId: mockSetSelectedDeckId,
        playingDeck: null,
        stopPlayingDeck: mockStopPlayingDeck,
      } as any);

      render(<Workspace />);

      expect(screen.getByText("Study Statistics")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId("mock-stats-workspace")).toBeInTheDocument();
      });
    });

    it("renders tutor workspace when activeSidebarView is tutor", async () => {
      vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
        activeSidebarView: "tutor",
        selectedDeck: null,
        setSelectedDeckId: mockSetSelectedDeckId,
        playingDeck: null,
        stopPlayingDeck: mockStopPlayingDeck,
      } as any);

      render(<Workspace />);

      expect(screen.getByText("Lessons (N3)")).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByTestId("mock-tutor-workspace")).toBeInTheDocument();
      });
    });
  });

  describe("Flashcard Player Overlay", () => {
    it("renders flashcard player overlay when playingDeck is active and stops playing on close", async () => {
      vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
        activeSidebarView: "notes",
        selectedDeck: null,
        setSelectedDeckId: mockSetSelectedDeckId,
        playingDeck: { id: "d1", name: "JLPT N5 Vocabulary", cards: [] },
        stopPlayingDeck: mockStopPlayingDeck,
      } as any);

      render(<Workspace />);

      await waitFor(() => {
        expect(screen.getByTestId("mock-flashcard-player")).toBeInTheDocument();
      });
      expect(screen.getByText("Playing: JLPT N5 Vocabulary")).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Stop Playing" }));
      expect(mockStopPlayingDeck).toHaveBeenCalled();
    });

    it("handles note selection triggered from sidebar", () => {
      render(<Workspace />);
      fireEvent.click(screen.getByRole("button", { name: "Select n99" }));
      expect(mockSetSelectedNoteId).toHaveBeenCalledWith("n99");
    });
  });
});
