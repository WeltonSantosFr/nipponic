import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import {
  AppSidebar,
  SidebarNoteItem,
  SidebarMyDeckItem,
  SidebarRemoteDeckItem,
} from "./app-sidebar";
import { SidebarProvider, SidebarMenu } from "@/components/ui/sidebar";
import * as AuthContextModule from "@/contexts/AuthContext";
import * as NotesContextModule from "@/contexts/NotesContext";
import * as FlashCardsContextModule from "@/contexts/FlashCardsContext";
import * as TutorContextModule from "@/contexts/TutorContext";
import { normalizeDeckName, type Note, type Deck } from "@nipponic/shared";

vi.mock("@/components/delete-note-modal", () => ({
  DeleteNoteModal: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-delete-note-modal">
        <button onClick={onConfirm}>Confirm Delete Note</button>
        <button onClick={onClose}>Cancel Delete Note</button>
      </div>
    ) : null,
}));

vi.mock("@/components/delete-deck-modal", () => ({
  DeleteDeckModal: ({ isOpen, onConfirm, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-delete-deck-modal">
        <button onClick={onConfirm}>Confirm Delete Deck</button>
        <button onClick={onClose}>Cancel Delete Deck</button>
      </div>
    ) : null,
}));

vi.mock("@/components/login-modal", () => ({
  LoginModal: ({ isOpen, onClose, initialMode }: any) =>
    isOpen ? (
      <div data-testid="mock-login-modal">
        <span>Mode: {initialMode}</span>
        <button onClick={onClose}>Close Login Modal</button>
      </div>
    ) : null,
}));

vi.mock("@/components/profile-modal", () => ({
  ProfileModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-profile-modal">
        <button onClick={onClose}>Close Profile Modal</button>
      </div>
    ) : null,
}));

vi.mock("@/components/settings-modal", () => ({
  SettingsModal: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="mock-settings-modal">
        <button onClick={onClose}>Close Settings Modal</button>
      </div>
    ) : null,
}));

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
        nextReviewAt: "2020-01-01T00:00:00.000Z",
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
    expect(screen.getByText("1")).toBeInTheDocument();
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

  it("handles fallback to Untitled Deck, card count pluralization, and selected state with due cards", () => {
    const emptyNameDeck: Deck = {
      ...mockDeckWithDue,
      name: "",
      cards: [
        mockDeckWithDue.cards[0]!,
        { ...mockDeckWithDue.cards[0]!, id: "c2" },
      ],
    };

    const { rerender } = renderWithSidebar(
      <SidebarMyDeckItem
        deck={emptyNameDeck}
        isSelected={true}
        onSelect={vi.fn()}
        onPlay={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    expect(screen.getByText("Untitled Deck")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByTitle(/2 cards due for review/)).toBeInTheDocument();

    // With zero due cards
    const noDueDeck: Deck = {
      ...mockDeckWithDue,
      name: "Clean Deck",
      cards: [],
    };
    rerender(
      <SidebarProvider>
        <SidebarMenu>
          <SidebarMyDeckItem
            deck={noDueDeck}
            isSelected={false}
            onSelect={vi.fn()}
            onPlay={vi.fn()}
            onDeleteRequest={vi.fn()}
          />
        </SidebarMenu>
      </SidebarProvider>
    );
    expect(screen.getByTitle("Play deck")).toBeInTheDocument();
  });
});

describe("SidebarRemoteDeckItem", () => {
  const mockRemoteDeck: Deck = {
    id: "remote-1",
    name: "Kana Mastery",
    isPublic: true,
    cards: [],
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

  it("renders spinner when isCloning is true and renders Layers icon when isPublic is false", () => {
    renderWithSidebar(
      <SidebarRemoteDeckItem
        deck={mockRemoteDeck}
        isSelected={false}
        isAlreadyAdded={false}
        isCloning={true}
        isPublic={false}
        onSelect={vi.fn()}
        onAddDeck={vi.fn()}
      />
    );

    const btn = screen.getByTitle("Add to My Decks");
    expect(btn).toBeDisabled();
  });
});

describe("AppSidebar - Views & Full Feature Suite", () => {
  const mockSetActiveSidebarView = vi.fn();
  const mockCreateNewNote = vi.fn().mockResolvedValue({ id: "n-new" });
  const mockDeleteNote = vi.fn();
  const mockCreateDeck = vi.fn().mockResolvedValue({ id: "d-new" });
  const mockDeleteDeck = vi.fn();
  const mockAddDeckToMyDecks = vi.fn().mockResolvedValue({ id: "d-cloned" });
  const mockStartPlayingDeck = vi.fn();
  const mockSetSelectedLevel = vi.fn();
  const mockLoadLesson = vi.fn();
  const mockGenerateNextUnit = vi.fn().mockResolvedValue(true);
  const mockLogout = vi.fn();

  const now = new Date();
  const todayDateStr = now.toISOString();
  const weekAgoDateStr = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgoDateStr = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString();
  const olderDateStr = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();

  const sampleNotes: Note[] = [
    { id: "n-today", title: "Today Note", enText: "", jpText: "", sourceLang: "EN", updatedAt: todayDateStr },
    { id: "n-week", title: "Week Note", enText: "", jpText: "", sourceLang: "EN", updatedAt: weekAgoDateStr },
    { id: "n-month", title: "Month Note", enText: "", jpText: "", sourceLang: "EN", updatedAt: monthAgoDateStr },
    { id: "n-older", title: "Older Note", enText: "", jpText: "", sourceLang: "EN", updatedAt: olderDateStr },
  ];

  const getBaseFlashcards = () => ({
    cards: [],
    decks: [{ id: "d-1", name: "My Core Deck", cards: [], isPublic: false }],
    appDecks: [{ id: "app-1", name: "App JLPT N5", cards: [], isPublic: false }],
    publicDecks: [{ id: "pub-1", name: "Public Deck 1", cards: [], isPublic: true }],
    activeDeckTab: "my",
    setActiveDeckTab: vi.fn(),
    selectedDeckId: null,
    selectedDeck: undefined,
    isCurrentDeckOwner: false,
    setSelectedDeckId: vi.fn(),
    activeSidebarView: "notes",
    setActiveSidebarView: mockSetActiveSidebarView,
    playingDeck: null,
    startPlayingDeck: mockStartPlayingDeck,
    stopPlayingDeck: vi.fn(),
    createCard: vi.fn(),
    updateCard: vi.fn(),
    deleteCard: vi.fn(),
    reviewCard: vi.fn(),
    getDueCards: () => [],
    createDeck: mockCreateDeck,
    updateDeck: vi.fn(),
    deleteDeck: mockDeleteDeck,
    addCardsToDeck: vi.fn(),
    removeCardFromDeck: vi.fn(),
    reorderDeckCards: vi.fn(),
    addDeckToMyDecks: mockAddDeckToMyDecks,
    refreshAll: vi.fn(),
    studyStats: {
      streak: { current: 5, longest: 10, lastStudiedAt: null, isActiveToday: true },
      today: { reviewsCount: 3, targetReviews: 20, retentionRate: 100 },
      cardsBreakdown: { total: 10, dueToday: 2, newCards: 1, learning: 2, mature: 7 },
      ratingsDistribution: { again: 0, hard: 0, good: 3, easy: 0, totalReviews: 3 },
      heatmap: [],
      forecast: [],
    },
    refreshStats: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
      user: { sub: "u-1", username: "welton", email: "w@example.com" },
      isAuthenticated: true,
      login: vi.fn(),
      logout: mockLogout,
      isWakingServer: false,
      hasInitialToken: true,
      setIsWakingServer: vi.fn(),
      setUser: vi.fn(),
    });

    vi.spyOn(NotesContextModule, "useNotes").mockReturnValue({
      notes: sampleNotes,
      selectedNoteId: null,
      selectedNote: undefined,
      setSelectedNoteId: vi.fn(),
      createNewNote: mockCreateNewNote,
      updateNoteContent: vi.fn(),
      saveNote: vi.fn(),
      deleteNote: mockDeleteNote,
      refreshNotes: vi.fn(),
    });

    vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue(getBaseFlashcards() as any);

    vi.spyOn(TutorContextModule, "useTutor").mockReturnValue({
      curriculum: [
        { id: "top-1", level: "N5", unitIndex: 1, unitTitle: "Unit 1", lessonIndex: 1, title: "Basic Greetings", grammarKey: "g1", objective: "Greetings", isCompleted: true, completedScore: 90 },
        { id: "top-2", level: "N5", unitIndex: 1, unitTitle: "Unit 1", lessonIndex: 2, title: "Ordering Food", grammarKey: "g2", objective: "Food", isCompleted: false },
      ],
      selectedLevel: "N5",
      setSelectedLevel: mockSetSelectedLevel,
      selectedTopicId: null,
      setSelectedTopicId: vi.fn(),
      currentLesson: null,
      isLoadingCurriculum: false,
      isLoadingLesson: false,
      isGeneratingUnit: false,
      error: null,
      clearError: vi.fn(),
      loadLesson: mockLoadLesson,
      generateNextUnit: mockGenerateNextUnit,
      submitProgress: vi.fn(),
      submitFeedback: vi.fn(),
      addVocabularyToDeck: vi.fn(),
      closeLesson: vi.fn(),
    });
  });

  describe("Notes View", () => {
    it("renders grouped notes by date (Today, This Week, This Month, Older) and creates new note", async () => {
      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("Today (1)")).toBeInTheDocument();
      expect(screen.getByText("Today Note")).toBeInTheDocument();
      expect(screen.getByText("Week Note")).toBeInTheDocument();
      expect(screen.getByText("Month Note")).toBeInTheDocument();
      expect(screen.getByText("Older Note")).toBeInTheDocument();

      const newNoteBtn = screen.getByRole("button", { name: /New Note/i });
      await act(async () => {
        fireEvent.click(newNoteBtn);
      });
      expect(mockCreateNewNote).toHaveBeenCalled();
    });

    it("filters notes via search input and clears search", () => {
      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const searchInput = screen.getByPlaceholderText("Search notes...");
      fireEvent.change(searchInput, { target: { value: "Today" } });

      expect(screen.getByText("Today Note")).toBeInTheDocument();
      expect(screen.queryByText("Older Note")).toBeNull();

      // Clear search
      const clearBtn = screen.getByTitle("Clear search");
      fireEvent.click(clearBtn);

      expect(screen.getByText("Older Note")).toBeInTheDocument();
    });

    it("opens DeleteNoteModal and deletes note on confirm", async () => {
      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const deleteBtns = screen.getAllByTitle("Delete note");
      fireEvent.click(deleteBtns[0]!);

      await waitFor(() => {
        expect(screen.getByTestId("mock-delete-note-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: "Confirm Delete Note" }));
      expect(mockDeleteNote).toHaveBeenCalledWith("n-today");
    });
  });

  describe("Flashcards View", () => {
    it("renders flashcards tab switcher, creates deck, and handles deck search", () => {
      const mockSetActiveDeckTab = vi.fn();
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "flashcards",
        activeDeckTab: "my",
        setActiveDeckTab: mockSetActiveDeckTab,
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByRole("button", { name: /New Deck/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /New Deck/i }));
      expect(mockCreateDeck).toHaveBeenCalledWith("New Deck");

      // Search deck
      const searchInput = screen.getByPlaceholderText("Search my decks...");
      fireEvent.change(searchInput, { target: { value: "Core" } });
      expect(screen.getByText("My Core Deck")).toBeInTheDocument();
    });

    it("renders app decks tab and clones app deck", async () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "flashcards",
        activeDeckTab: "app",
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("App JLPT N5")).toBeInTheDocument();
      const addBtn = screen.getByTitle("Add to My Decks");
      await act(async () => {
        fireEvent.click(addBtn);
      });
      expect(mockAddDeckToMyDecks).toHaveBeenCalled();
    });

    it("renders public decks tab and clones public deck", async () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "flashcards",
        activeDeckTab: "public",
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("Public Deck 1")).toBeInTheDocument();
      const addBtn = screen.getByTitle("Add to My Decks");
      await act(async () => {
        fireEvent.click(addBtn);
      });
      expect(mockAddDeckToMyDecks).toHaveBeenCalled();
    });

    it("opens DeleteDeckModal and confirms deck deletion", async () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "flashcards",
        activeDeckTab: "my",
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const deleteBtn = screen.getByTitle("Delete deck");
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(screen.getByTestId("mock-delete-deck-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByRole("button", { name: "Confirm Delete Deck" }));
      expect(mockDeleteDeck).toHaveBeenCalledWith("d-1");
    });
  });

  describe("Tutor View", () => {
    it("switches levels and loads lesson", async () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "tutor",
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      // Level switch
      const n2Btn = screen.getByRole("button", { name: "N2" });
      fireEvent.click(n2Btn);
      expect(mockSetSelectedLevel).toHaveBeenCalledWith("N2");

      // Click lesson item
      const lessonBtn = screen.getByText(/Basic Greetings/i);
      fireEvent.click(lessonBtn);
      expect(mockLoadLesson).toHaveBeenCalledWith("top-1");
    });

    it("renders loading skeleton when curriculum is loading", () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "tutor",
      } as any);

      vi.spyOn(TutorContextModule, "useTutor").mockReturnValue({
        curriculum: [],
        selectedLevel: "N5",
        setSelectedLevel: mockSetSelectedLevel,
        selectedTopicId: null,
        setSelectedTopicId: vi.fn(),
        currentLesson: null,
        isLoadingCurriculum: true,
        isLoadingLesson: false,
        isGeneratingUnit: false,
        error: null,
        clearError: vi.fn(),
        loadLesson: mockLoadLesson,
        generateNextUnit: mockGenerateNextUnit,
        submitProgress: vi.fn(),
        submitFeedback: vi.fn(),
        addVocabularyToDeck: vi.fn(),
        closeLesson: vi.fn(),
      });

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("Loading JLPT N5 lessons...")).toBeInTheDocument();
    });

    it("renders empty curriculum state without AI generation button", async () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "tutor",
      } as any);

      vi.spyOn(TutorContextModule, "useTutor").mockReturnValue({
        curriculum: [],
        selectedLevel: "N5",
        setSelectedLevel: mockSetSelectedLevel,
        selectedTopicId: null,
        setSelectedTopicId: vi.fn(),
        currentLesson: null,
        isLoadingCurriculum: false,
        isLoadingLesson: false,
        isGeneratingUnit: false,
        error: null,
        clearError: vi.fn(),
        loadLesson: mockLoadLesson,
        generateNextUnit: mockGenerateNextUnit,
        submitProgress: vi.fn(),
        submitFeedback: vi.fn(),
        addVocabularyToDeck: vi.fn(),
        closeLesson: vi.fn(),
      });

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("No lessons loaded for JLPT N5.")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /generate with ai/i })).not.toBeInTheDocument();
    });

    it("switches to tutor view when clicking Lessons switcher button", () => {
      const mockSetActiveSidebarView = vi.fn();
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "notes",
        setActiveSidebarView: mockSetActiveSidebarView,
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const lessonsBtn = screen.getByRole("button", { name: /Lessons/i });
      fireEvent.click(lessonsBtn);
      expect(mockSetActiveSidebarView).toHaveBeenCalledWith("tutor");
    });

    it("switches to practice view when clicking Practice switcher button and renders practice sidebar", () => {
      const mockSetActiveSidebarView = vi.fn();
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "practice",
        setActiveSidebarView: mockSetActiveSidebarView,
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const practiceBtn = screen.getByRole("button", { name: /Practice/i });
      fireEvent.click(practiceBtn);
      expect(mockSetActiveSidebarView).toHaveBeenCalledWith("practice");
      expect(screen.getByText("Translation Practice")).toBeInTheDocument();
      expect(screen.getByText("Daily Progressive MVP")).toBeInTheDocument();
    });

    it("renders curriculum topics and loads lesson on click, closing mobile sidebar", () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "tutor",
      } as any);

      const mockLoad = vi.fn();
      vi.spyOn(TutorContextModule, "useTutor").mockReturnValue({
        curriculum: [
          { id: "top_1", title: "Basic Greetings", isCompleted: true } as any,
          { id: "top_2", title: "Numbers & Time", isCompleted: false } as any,
        ],
        selectedLevel: "N5",
        setSelectedLevel: mockSetSelectedLevel,
        selectedTopicId: "top_1",
        setSelectedTopicId: vi.fn(),
        currentLesson: null,
        isLoadingCurriculum: false,
        isLoadingLesson: false,
        isGeneratingUnit: false,
        error: null,
        clearError: vi.fn(),
        loadLesson: mockLoad,
        generateNextUnit: mockGenerateNextUnit,
        submitProgress: vi.fn(),
        submitFeedback: vi.fn(),
        addVocabularyToDeck: vi.fn(),
        closeLesson: vi.fn(),
      });

      // Emulate mobile environment
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("max-width: 768px"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <SidebarProvider defaultOpen={true}>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByTitle("Basic Greetings")).toBeInTheDocument();
      expect(screen.getByTitle("Numbers & Time")).toBeInTheDocument();

      // Click topic 2
      const topic2Btn = screen.getByTitle("Numbers & Time");
      fireEvent.click(topic2Btn);
      expect(mockLoad).toHaveBeenCalledWith("top_2");
    });
  });

  describe("Stats View", () => {
    it("renders stats overview and starts reviewing due cards", () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "stats",
        getDueCards: () => [{ id: "c-due", jpText: "日", enText: "Sun" } as any],
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("5 days")).toBeInTheDocument();
      expect(screen.getByText("3 / 20")).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();

      const reviewBtn = screen.getByRole("button", { name: /Review 2 Due Cards/i });
      fireEvent.click(reviewBtn);
      expect(mockStartPlayingDeck).toHaveBeenCalled();
    });

    it("renders no cards due message when all cards are reviewed", () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "stats",
        studyStats: {
          ...getBaseFlashcards().studyStats,
          cardsBreakdown: {
            ...getBaseFlashcards().studyStats.cardsBreakdown,
            dueToday: 0,
          },
        },
        cards: [],
        getDueCards: () => [],
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("No cards due right now")).toBeInTheDocument();
    });
  });

  describe("Footer & Authentication", () => {
    it("logs out and opens profile and settings modals when authenticated", async () => {
      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      // Logout
      fireEvent.click(screen.getByText("Logout"));
      expect(mockLogout).toHaveBeenCalled();

      // Profile modal
      fireEvent.click(screen.getByText("Profile"));
      await waitFor(() => {
        expect(screen.getByTestId("mock-profile-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Close Profile Modal"));
      expect(screen.queryByTestId("mock-profile-modal")).not.toBeInTheDocument();

      // Settings modal
      fireEvent.click(screen.getByText("Configurations"));
      await waitFor(() => {
        expect(screen.getByTestId("mock-settings-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Close Settings Modal"));
      expect(screen.queryByTestId("mock-settings-modal")).not.toBeInTheDocument();

      // Support Nipponic link
      const supportLink = screen.getByText("Support Nipponic 💖").closest("a");
      expect(supportLink).toHaveAttribute("href", "/sponsors");
    });

    it("triggers note deletion dialog, handles cancellation and confirmation", async () => {
      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const deleteButtons = screen.getAllByTitle("Delete note");
      expect(deleteButtons.length).toBeGreaterThan(0);

      // Open and cancel delete note
      fireEvent.click(deleteButtons[0]!);
      await waitFor(() => {
        expect(screen.getByTestId("mock-delete-note-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Cancel Delete Note"));
      expect(screen.queryByTestId("mock-delete-note-modal")).not.toBeInTheDocument();
      expect(mockDeleteNote).not.toHaveBeenCalled();

      // Open and confirm delete note
      fireEvent.click(deleteButtons[0]!);
      await waitFor(() => {
        expect(screen.getByTestId("mock-delete-note-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Confirm Delete Note"));
      expect(mockDeleteNote).toHaveBeenCalledWith("n-today");
    });

    it("triggers deck deletion dialog, handles cancellation and confirmation", async () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "flashcards",
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const deleteButtons = screen.getAllByTitle("Delete deck");
      expect(deleteButtons.length).toBeGreaterThan(0);

      // Open and cancel delete deck
      fireEvent.click(deleteButtons[0]!);
      await waitFor(() => {
        expect(screen.getByTestId("mock-delete-deck-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Cancel Delete Deck"));
      expect(screen.queryByTestId("mock-delete-deck-modal")).not.toBeInTheDocument();
      expect(mockDeleteDeck).not.toHaveBeenCalled();

      // Open and confirm delete deck
      fireEvent.click(deleteButtons[0]!);
      await waitFor(() => {
        expect(screen.getByTestId("mock-delete-deck-modal")).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText("Confirm Delete Deck"));
      expect(mockDeleteDeck).toHaveBeenCalledWith("d-1");
    });

    it("shows login and registration options when unauthenticated", async () => {
      vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
        user: null,
        isAuthenticated: false,
        login: vi.fn(),
        logout: vi.fn(),
        isWakingServer: false,
        hasInitialToken: false,
        setIsWakingServer: vi.fn(),
        setUser: vi.fn(),
      });

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("Sign in to keep your notes and decks")).toBeInTheDocument();

      // Create account
      fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));
      await waitFor(() => {
        expect(screen.getByTestId("mock-login-modal")).toBeInTheDocument();
      });
      expect(screen.getByText("Mode: register")).toBeInTheDocument();

      // Close and open Login
      fireEvent.click(screen.getByRole("button", { name: "Close Login Modal" }));
      fireEvent.click(screen.getByText("Login"));
      await waitFor(() => {
        expect(screen.getByText("Mode: login")).toBeInTheDocument();
      });
    });

    it("switches deck tabs and clears search query", async () => {
      const mockSetActiveDeckTab = vi.fn();
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "flashcards",
        setActiveDeckTab: mockSetActiveDeckTab,
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      // Switch to App Decks tab
      fireEvent.click(screen.getByRole("button", { name: "App Decks" }));
      expect(mockSetActiveDeckTab).toHaveBeenCalledWith("app");

      // Switch to Public tab
      fireEvent.click(screen.getByRole("button", { name: /Public/i }));
      expect(mockSetActiveDeckTab).toHaveBeenCalledWith("public");

      // Search and clear
      const searchInput = screen.getByPlaceholderText(/Search my decks.../i);
      fireEvent.change(searchInput, { target: { value: "JLPT" } });
      expect(searchInput).toHaveValue("JLPT");

      const clearBtn = screen.getByTitle("Clear search");
      fireEvent.click(clearBtn);
      expect(searchInput).toHaveValue("");
    });

    it("closes mobile sidebar when clicking a curriculum topic", async () => {
      const mockLoadLesson = vi.fn().mockResolvedValue(null);

      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "tutor",
      } as any);

      vi.spyOn(TutorContextModule, "useTutor").mockReturnValue({
        curriculum: [
          {
            id: "top-mob-1",
            level: "N5",
            unitIndex: 1,
            unitTitle: "Unit 1",
            lessonIndex: 1,
            title: "Greetings",
            grammarKey: "g1",
            objective: "Obj",
            isCompleted: true,
            completedScore: 80,
          },
        ],
        selectedLevel: "N5",
        setSelectedLevel: vi.fn(),
        selectedTopicId: null,
        setSelectedTopicId: vi.fn(),
        currentLesson: null,
        isLoadingCurriculum: false,
        isLoadingLesson: false,
        isGeneratingUnit: false,
        error: null,
        clearError: vi.fn(),
        loadLesson: mockLoadLesson,
        generateNextUnit: vi.fn(),
        submitProgress: vi.fn(),
        submitFeedback: vi.fn(),
        addVocabularyToDeck: vi.fn(),
        closeLesson: vi.fn(),
      });

      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <SidebarProvider defaultOpen={true}>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const topicBtn = screen.getByTitle("Greetings");
      fireEvent.click(topicBtn);
      expect(mockLoadLesson).toHaveBeenCalledWith("top-mob-1");
    });

    it("navigates to Study Stats view and renders streak flame badge", () => {
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        studyStats: {
          streak: { current: 7, longest: 10 },
          totalReviews: 42,
          retentionRate: 85,
          dueTodayCount: 5,
        },
        setActiveSidebarView: mockSetActiveSidebarView,
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("7d")).toBeInTheDocument();
      const statsBtn = screen.getByRole("button", { name: /Study Stats/i });
      fireEvent.click(statsBtn);
      expect(mockSetActiveSidebarView).toHaveBeenCalledWith("stats");
    });

    it("closes mobile sidebar when clicking New Note", async () => {
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <SidebarProvider defaultOpen={true}>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const newNoteBtn = screen.getByRole("button", { name: /New Note/i });
      await act(async () => {
        fireEvent.click(newNoteBtn);
      });
      expect(mockCreateNewNote).toHaveBeenCalled();
    });

    it("switches deck tab back to 'my' when clicking My tab", () => {
      const mockSetActiveDeckTab = vi.fn();
      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "flashcards",
        activeDeckTab: "app",
        setActiveDeckTab: mockSetActiveDeckTab,
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const myTabBtn = screen.getByRole("button", { name: /My \(/i });
      fireEvent.click(myTabBtn);
      expect(mockSetActiveDeckTab).toHaveBeenCalledWith("my");
    });

    it("displays 16 due (not 29) when 1 deck has 16 cards and 13 orphan cards exist", () => {
      const deckCards = Array.from({ length: 16 }, (_, i) => ({
        id: `deck-card-${i}`,
        jpText: `Card ${i}`,
        enText: `Translation ${i}`,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReviewAt: new Date(Date.now() - 1000).toISOString(),
        lastReviewedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }));

      const orphanCards = Array.from({ length: 13 }, (_, i) => ({
        id: `orphan-card-${i}`,
        jpText: `Orphan ${i}`,
        enText: `Orphan Trans ${i}`,
        interval: 0,
        easeFactor: 2.5,
        repetitions: 0,
        lapses: 0,
        nextReviewAt: new Date(Date.now() - 1000).toISOString(),
        lastReviewedAt: null,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }));

      const singleDeck = {
        id: "deck-1",
        name: "Single Deck",
        cards: deckCards,
        isPublic: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };

      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "stats",
        cards: [...deckCards, ...orphanCards], // 29 cards total
        decks: [singleDeck],
        getDueCards: () => deckCards, // only 16 deck cards are due
        studyStats: {
          streak: { current: 1, longest: 1, lastStudiedAt: null, isActiveToday: true },
          today: { reviewsCount: 0, targetReviews: 20, retentionRate: 100 },
          cardsBreakdown: { total: 29, dueToday: 29, newCards: 29, learning: 0, mature: 0 },
          ratingsDistribution: { again: 0, hard: 0, good: 0, easy: 0, totalReviews: 0 },
          heatmap: [],
          forecast: [],
        },
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      // Verify the Cards badge shows "16 due"
      expect(screen.getByText("16 due")).toBeInTheDocument();
      // Verify bottom review button shows "Review 16 Due Cards"
      expect(screen.getByText("Review 16 Due Cards")).toBeInTheDocument();
    });

    it("displays 'No cards due right now' when all deck cards are reviewed even if orphan cards exist", () => {
      const reviewedDeckCards = Array.from({ length: 16 }, (_, i) => ({
        id: `deck-card-${i}`,
        jpText: `Card ${i}`,
        enText: `Translation ${i}`,
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        lapses: 0,
        nextReviewAt: new Date(Date.now() + 86400000).toISOString(),
        lastReviewedAt: new Date().toISOString(),
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      }));

      const singleDeck = {
        id: "deck-1",
        name: "Single Deck",
        cards: reviewedDeckCards,
        isPublic: false,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      };

      vi.spyOn(FlashCardsContextModule, "useFlashCards").mockReturnValue({
        ...getBaseFlashcards(),
        activeSidebarView: "stats",
        cards: reviewedDeckCards,
        decks: [singleDeck],
        getDueCards: () => [],
        studyStats: {
          streak: { current: 1, longest: 1, lastStudiedAt: null, isActiveToday: true },
          today: { reviewsCount: 16, targetReviews: 20, retentionRate: 100 },
          cardsBreakdown: { total: 29, dueToday: 13, newCards: 0, learning: 16, mature: 0 },
          ratingsDistribution: { again: 0, hard: 0, good: 16, easy: 0, totalReviews: 16 },
          heatmap: [],
          forecast: [],
        },
      } as any);

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      // Verify the badge is NOT rendered
      expect(screen.queryByText(/due$/)).not.toBeInTheDocument();
      // Verify bottom review button shows "No cards due right now"
      expect(screen.getByText("No cards due right now")).toBeInTheDocument();
    });

    it("renders Feedback & Support button and opens feedback modal", () => {
      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      const feedbackBtn = screen.getByText("Feedback & Support");
      expect(feedbackBtn).toBeInTheDocument();
      fireEvent.click(feedbackBtn);
    });

    it("renders Admin Dashboard link only when user has ADMIN role", () => {
      vi.spyOn(AuthContextModule, "useAuth").mockReturnValue({
        user: {
          sub: "admin-1",
          email: "admin@example.com",
          username: "adminUser",
          role: "ADMIN",
        },
        isAuthenticated: true,
        login: vi.fn(),
        logout: vi.fn(),
        isWakingServer: false,
        hasInitialToken: true,
        setIsWakingServer: vi.fn(),
        setUser: vi.fn(),
      });

      render(
        <SidebarProvider>
          <AppSidebar selectedNoteId={null} onSelectNote={vi.fn()} />
        </SidebarProvider>
      );

      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });
  });
});

