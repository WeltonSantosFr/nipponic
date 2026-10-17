import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { NotesProvider, useNotes } from "./NotesContext";
import { Note } from "@nipponic/shared";

// Mock server actions
vi.mock("@/actions/notes", () => ({
  getNotesAction: vi.fn(),
  createNoteAction: vi.fn(),
  updateNoteAction: vi.fn(),
  deleteNoteAction: vi.fn(),
}));

let mockIsAuthenticated = true;
let mockIsWakingServer = false;

vi.mock("./AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    isWakingServer: mockIsWakingServer,
  }),
}));

function TestConsumer() {
  const {
    notes,
    selectedNote,
    selectedNoteId,
    createNewNote,
    updateNoteContent,
    saveNote,
    deleteNote,
    refreshNotes,
  } = useNotes();

  return (
    <div>
      <div data-testid="notes-count">{notes.length}</div>
      <div data-testid="selected-note-id">{selectedNoteId || "none"}</div>
      <div data-testid="selected-note-title">{selectedNote?.title || "none"}</div>
      <div data-testid="selected-note-content">{selectedNote?.enText || "none"}</div>
      <button
        data-testid="create-note-btn"
        onClick={() => createNewNote()}
      >
        Create
      </button>
      <button
        data-testid="update-note-btn"
        onClick={() => {
          if (selectedNoteId) {
            updateNoteContent(selectedNoteId, {
              title: "Updated Title",
              enText: "New content",
            });
          }
        }}
      >
        Update
      </button>
      <button
        data-testid="save-note-btn"
        onClick={() => {
          if (selectedNoteId) {
            saveNote(selectedNoteId);
          }
        }}
      >
        Save
      </button>
      <button
        data-testid="delete-note-btn"
        onClick={() => {
          if (selectedNoteId) {
            deleteNote(selectedNoteId);
          }
        }}
      >
        Delete
      </button>
      <button
        data-testid="refresh-notes-btn"
        onClick={() => refreshNotes()}
      >
        Refresh
      </button>
    </div>
  );
}

describe("NotesContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockIsAuthenticated = true;
    mockIsWakingServer = false;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("creates a new note with backend UUID when authenticated and selects it", async () => {
    const { createNoteAction, getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue([]);
    (createNoteAction as any).mockResolvedValue({
      id: "real-uuid-1",
      title: "Untitled Note",
      enText: "",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:00.000Z",
    });

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    await act(async () => {
      screen.getByTestId("create-note-btn").click();
    });

    expect(createNoteAction).toHaveBeenCalledWith({
      title: "Untitled Note",
      enText: "",
      jpText: "",
      sourceLang: "EN",
    });

    expect(screen.getByTestId("selected-note-id")).toHaveTextContent("real-uuid-1");
    expect(screen.getByTestId("notes-count")).toHaveTextContent("1");
    expect(localStorage.getItem("nipponic.selected_note_id")).toBe("real-uuid-1");
  });

  it("automatically saves edits via debounced autosave after 500ms", async () => {
    vi.useFakeTimers();
    const { createNoteAction, updateNoteAction, getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue([]);
    (createNoteAction as any).mockResolvedValue({
      id: "note-abc",
      title: "Untitled Note",
      enText: "",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:00.000Z",
    });
    (updateNoteAction as any).mockResolvedValue({
      id: "note-abc",
      title: "Updated Title",
      enText: "New content",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:05.000Z",
    });

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    // Create note
    await act(async () => {
      screen.getByTestId("create-note-btn").click();
    });

    expect(screen.getByTestId("selected-note-id")).toHaveTextContent("note-abc");

    // Trigger update
    act(() => {
      screen.getByTestId("update-note-btn").click();
    });

    // In-memory state updates immediately
    expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Updated Title");
    expect(screen.getByTestId("selected-note-content")).toHaveTextContent("New content");

    // updateNoteAction has not been called before timer fires
    expect(updateNoteAction).not.toHaveBeenCalled();

    // Fast-forward 500ms for debounce
    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(updateNoteAction).toHaveBeenCalledWith(
      "note-abc",
      expect.objectContaining({
        title: "Updated Title",
        enText: "New content",
      })
    );
  });

  it("flushes debounced autosave immediately on explicit save (blur)", async () => {
    vi.useFakeTimers();
    const { createNoteAction, updateNoteAction, getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue([]);
    (createNoteAction as any).mockResolvedValue({
      id: "note-abc",
      title: "Untitled Note",
      enText: "",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:00.000Z",
    });
    (updateNoteAction as any).mockResolvedValue({
      id: "note-abc",
      title: "Updated Title",
      enText: "New content",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:05.000Z",
    });

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    await act(async () => {
      screen.getByTestId("create-note-btn").click();
    });

    act(() => {
      screen.getByTestId("update-note-btn").click();
    });

    // Click save before 500ms
    await act(async () => {
      screen.getByTestId("save-note-btn").click();
    });

    expect(updateNoteAction).toHaveBeenCalledTimes(1);

    // After remaining time, it should NOT double-save
    await act(async () => {
      vi.advanceTimersByTime(600);
    });

    expect(updateNoteAction).toHaveBeenCalledTimes(1);
  });

  it("restores cached notes and active selection on hydration", async () => {
    const cachedNotes: Note[] = [
      {
        id: "cached-1",
        title: "Cached Note 1",
        enText: "Hello world",
        jpText: "こんにちは",
        sourceLang: "EN",
        updatedAt: "2026-10-17T10:00:00.000Z",
      },
    ];
    localStorage.setItem("nipponic.cached_notes", JSON.stringify(cachedNotes));
    localStorage.setItem("nipponic.selected_note_id", "cached-1");

    const { getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue(cachedNotes);

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("notes-count")).toHaveTextContent("1");
      expect(screen.getByTestId("selected-note-id")).toHaveTextContent("cached-1");
      expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Cached Note 1");
    });
  });

  it("smart merge preserves temp- notes when server responds on refresh", async () => {
    const tempNote: Note = {
      id: "temp-offline-1",
      title: "Offline Created Note",
      enText: "I was offline",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T10:00:00.000Z",
    };
    localStorage.setItem("nipponic.cached_notes", JSON.stringify([tempNote]));
    localStorage.setItem("nipponic.selected_note_id", "temp-offline-1");

    const serverNotes: Note[] = [
      {
        id: "server-note-1",
        title: "Server Note",
        enText: "From cloud",
        jpText: "",
        sourceLang: "EN",
        updatedAt: "2026-10-17T09:00:00.000Z",
      },
    ];

    const { getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue(serverNotes);

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    await waitFor(() => {
      // Both the local temp note and server note are preserved
      expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
      expect(screen.getByTestId("selected-note-id")).toHaveTextContent("temp-offline-1");
      expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Offline Created Note");
    });
  });

  it("flushes pending saves on beforeunload", async () => {
    vi.useFakeTimers();
    const { createNoteAction, updateNoteAction, getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue([]);
    (createNoteAction as any).mockResolvedValue({
      id: "note-unload-1",
      title: "Untitled Note",
      enText: "",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:00.000Z",
    });
    (updateNoteAction as any).mockResolvedValue({
      id: "note-unload-1",
      title: "Updated Title",
      enText: "New content",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:05.000Z",
    });

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    await act(async () => {
      screen.getByTestId("create-note-btn").click();
    });

    act(() => {
      screen.getByTestId("update-note-btn").click();
    });

    // Simulate beforeunload before timer completes
    await act(async () => {
      window.dispatchEvent(new Event("beforeunload"));
    });

    expect(updateNoteAction).toHaveBeenCalledWith(
      "note-unload-1",
      expect.objectContaining({
        title: "Updated Title",
        enText: "New content",
      })
    );
  });
});
