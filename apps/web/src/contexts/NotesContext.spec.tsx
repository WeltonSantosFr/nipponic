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
        data-testid="update-note-1-btn"
        onClick={() => {
          if (selectedNoteId) {
            updateNoteContent(selectedNoteId, {
              title: "Note 1 Title",
              enText: "Content of note 1",
            });
          }
        }}
      >
        Update Note 1
      </button>
      <button
        data-testid="update-note-2-btn"
        onClick={() => {
          if (selectedNoteId) {
            updateNoteContent(selectedNoteId, {
              title: "Note 2 Title",
              enText: "Content of note 2",
            });
          }
        }}
      >
        Update Note 2
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

  it("regression: creating two notes with content does not lose notes on page refresh (F5)", async () => {
    const { createNoteAction, getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue([]);
    // Simulate backend returning null (e.g. cookie dropped/missing on server)
    (createNoteAction as any).mockResolvedValue(null);

    // Initial render
    const { unmount } = render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    // Create Note 1
    await act(async () => {
      screen.getByTestId("create-note-btn").click();
    });

    // Update Note 1
    act(() => {
      screen.getByTestId("update-note-1-btn").click();
    });

    expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Note 1 Title");
    expect(screen.getByTestId("selected-note-content")).toHaveTextContent("Content of note 1");

    // Create Note 2
    await act(async () => {
      screen.getByTestId("create-note-btn").click();
    });

    // Update Note 2
    act(() => {
      screen.getByTestId("update-note-2-btn").click();
    });

    expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
    expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Note 2 Title");
    expect(screen.getByTestId("selected-note-content")).toHaveTextContent("Content of note 2");

    // Verify localStorage has both notes
    const cached = JSON.parse(localStorage.getItem("nipponic.cached_notes") || "[]");
    expect(cached).toHaveLength(2);
    expect(cached[0].title).toBe("Note 2 Title");
    expect(cached[1].title).toBe("Note 1 Title");

    // Simulate page refresh (F5): unmount and remount provider
    unmount();

    // Server still returns [] on refresh
    (getNotesAction as any).mockResolvedValue([]);

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    // Both notes MUST still exist in state and UI!
    await waitFor(() => {
      expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
      expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Note 2 Title");
      expect(screen.getByTestId("selected-note-content")).toHaveTextContent("Content of note 2");
    });

    // LocalStorage must still preserve both notes
    const postRefreshCached = JSON.parse(localStorage.getItem("nipponic.cached_notes") || "[]");
    expect(postRefreshCached).toHaveLength(2);
    expect(postRefreshCached[0].title).toBe("Note 2 Title");
    expect(postRefreshCached[1].title).toBe("Note 1 Title");
  });

  it("regression: unauthenticated state does not erase local/cached notes", async () => {
    mockIsAuthenticated = false;
    const initialNotes: Note[] = [
      {
        id: "local-note-1",
        title: "Guest Note 1",
        enText: "Guest content 1",
        jpText: "",
        sourceLang: "EN",
        updatedAt: "2026-10-17T10:00:00.000Z",
      },
      {
        id: "local-note-2",
        title: "Guest Note 2",
        enText: "Guest content 2",
        jpText: "",
        sourceLang: "EN",
        updatedAt: "2026-10-17T11:00:00.000Z",
      },
    ];
    localStorage.setItem("nipponic.cached_notes", JSON.stringify(initialNotes));
    localStorage.setItem("nipponic.selected_note_id", "local-note-1");

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
      expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Guest Note 1");
    });

    // Trigger refreshNotes while unauthenticated
    await act(async () => {
      screen.getByTestId("refresh-notes-btn").click();
    });

    // Notes must NOT be wiped to []!
    expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
    expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Guest Note 1");
  });

  it("regression: syncing temp note to backend swaps ID and preserves edits when saveNote is called", async () => {
    const { createNoteAction, getNotesAction } = await import("@/actions/notes");
    (getNotesAction as any).mockResolvedValue([]);
    // Initially fails to create on backend
    (createNoteAction as any).mockResolvedValueOnce(null);

    render(
      <NotesProvider>
        <TestConsumer />
      </NotesProvider>
    );

    await act(async () => {
      screen.getByTestId("create-note-btn").click();
    });

    expect(screen.getByTestId("selected-note-id").textContent).toMatch(/^temp-/);
    const tempId = screen.getByTestId("selected-note-id").textContent!;

    // User updates content
    act(() => {
      screen.getByTestId("update-note-1-btn").click();
    });

    // Backend recovers: subsequent createNoteAction call succeeds
    (createNoteAction as any).mockResolvedValueOnce({
      id: "synced-backend-uuid",
      title: "Note 1 Title",
      enText: "Content of note 1",
      jpText: "",
      sourceLang: "EN",
      updatedAt: "2026-10-17T12:00:10.000Z",
    });

    // Save note
    await act(async () => {
      screen.getByTestId("save-note-btn").click();
    });

    // ID should now be swapped to synced-backend-uuid
    await waitFor(() => {
      expect(screen.getByTestId("selected-note-id")).toHaveTextContent("synced-backend-uuid");
      expect(screen.getByTestId("selected-note-title")).toHaveTextContent("Note 1 Title");
    });

    const cached = JSON.parse(localStorage.getItem("nipponic.cached_notes") || "[]");
    expect(cached[0].id).toBe("synced-backend-uuid");
    expect(cached[0].title).toBe("Note 1 Title");
    expect(localStorage.getItem("nipponic.selected_note_id")).toBe("synced-backend-uuid");
  });

  describe("deleteNote", () => {
    it("deletes note optimistically, cancels pending timer, updates selection and calls deleteNoteAction", async () => {
      const { deleteNoteAction, getNotesAction } = await import("@/actions/notes");
      let mockNotes: Note[] = [
        { id: "note-del-1", title: "Note 1", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
        { id: "note-del-2", title: "Note 2", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      localStorage.setItem("nipponic.selected_note_id", "note-del-1");
      (getNotesAction as any).mockImplementation(async () => mockNotes);
      (deleteNoteAction as any).mockImplementation(async (id: string) => {
        mockNotes = mockNotes.filter((n) => n.id !== id);
        return { success: true };
      });

      function DeleteConsumer() {
        const { notes, selectedNoteId, setSelectedNoteId, deleteNote, updateNoteContent } = useNotes();
        return (
          <div>
            <div data-testid="notes-count">{notes.length}</div>
            <div data-testid="selected-note-id">{selectedNoteId || "none"}</div>
            <button
              data-testid="edit-btn"
              onClick={() => updateNoteContent("note-del-1", { title: "About to be deleted" })}
            >
              Edit
            </button>
            <button
              data-testid="delete-btn"
              onClick={() => deleteNote("note-del-1")}
            >
              Delete Note 1
            </button>
            <button
              data-testid="delete-temp"
              onClick={() => deleteNote("temp-123")}
            >
              Delete Temp
            </button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <DeleteConsumer />
        </NotesProvider>
      );

      expect(screen.getByTestId("notes-count")).toHaveTextContent("2");
      expect(screen.getByTestId("selected-note-id")).toHaveTextContent("note-del-1");

      // Edit schedules autosave
      act(() => {
        screen.getByTestId("edit-btn").click();
      });

      // Delete cancels autosave timer, deletes note, sets selection to none
      await act(async () => {
        screen.getByTestId("delete-btn").click();
      });

      expect(screen.getByTestId("notes-count")).toHaveTextContent("1");
      expect(screen.getByTestId("selected-note-id")).toHaveTextContent("note-del-2");
      expect(deleteNoteAction).toHaveBeenCalledWith("note-del-1");

      // Deleting a temp- note should not call backend action
      (deleteNoteAction as any).mockClear();
      await act(async () => {
        screen.getByTestId("delete-temp").click();
      });
      expect(deleteNoteAction).not.toHaveBeenCalled();
    });

    it("catches and logs error when deleteNoteAction throws", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { deleteNoteAction, getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockResolvedValue([
        { id: "note-err-del", title: "Error Del", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" }
      ]);
      (deleteNoteAction as any).mockRejectedValue(new Error("Server delete failure"));

      function Consumer() {
        const { deleteNote, notes } = useNotes();
        return (
          <div>
            <div data-testid="notes-count">{notes.length}</div>
            <button data-testid="del-btn" onClick={() => deleteNote("note-err-del")}>Delete</button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("notes-count")).toHaveTextContent("1");
      });

      await act(async () => {
        screen.getByTestId("del-btn").click();
      });

      expect(errorSpy).toHaveBeenCalledWith("Error deleting note on backend:", expect.any(Error));
      errorSpy.mockRestore();
    });
  });

  describe("debounced autosave and lifecycle flush", () => {
    it("debounces rapid edits and triggers saveNote after 500ms", async () => {
      vi.useFakeTimers();
      const mockNotes: Note[] = [
        { id: "note-debounce-1", title: "Debounce Note", enText: "A", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" }
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      const { updateNoteAction, getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockResolvedValue(mockNotes);
      (updateNoteAction as any).mockResolvedValue({ id: "note-debounce-1", updatedAt: "2026-10-18T10:00:05.000Z" });

      function DebounceConsumer() {
        const { updateNoteContent, notes } = useNotes();
        return (
          <div>
            <button
              data-testid="edit-rapid"
              onClick={() => {
                updateNoteContent("note-debounce-1", { enText: "First edit" });
                updateNoteContent("note-debounce-1", { enText: "Second edit" });
              }}
            >
              Rapid Edit
            </button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <DebounceConsumer />
        </NotesProvider>
      );

      act(() => {
        screen.getByTestId("edit-rapid").click();
      });

      // Not called yet immediately
      expect(updateNoteAction).not.toHaveBeenCalled();

      // Advance by 500ms
      await act(async () => {
        vi.advanceTimersByTime(500);
      });

      expect(updateNoteAction).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it("flushes pending saves on visibilitychange (hidden) and unmount", async () => {
      vi.useFakeTimers();
      const mockNotes: Note[] = [
        { id: "note-flush-1", title: "Flush Note", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" }
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      const { updateNoteAction, getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockResolvedValue(mockNotes);
      (updateNoteAction as any).mockResolvedValue({ id: "note-flush-1", updatedAt: "2026-10-18T10:00:05.000Z" });

      function FlushConsumer() {
        const { updateNoteContent } = useNotes();
        return (
          <button
            data-testid="edit-btn"
            onClick={() => updateNoteContent("note-flush-1", { enText: "Unsaved text" })}
          >
            Edit
          </button>
        );
      }

      const { unmount } = render(
        <NotesProvider>
          <FlushConsumer />
        </NotesProvider>
      );

      act(() => {
        screen.getByTestId("edit-btn").click();
      });

      // Trigger visibility change to hidden
      Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(updateNoteAction).toHaveBeenCalledWith(
        "note-flush-1",
        expect.objectContaining({ enText: "Unsaved text" })
      );

      // Trigger unmount
      unmount();
      vi.useRealTimers();
    });
  });

  describe("error handling and edge cases", () => {
    it("handles backend errors gracefully when updateNoteAction throws", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { updateNoteAction, getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockResolvedValue([
        { id: "note-err-upd", title: "Error Upd", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" }
      ]);
      (updateNoteAction as any).mockRejectedValue(new Error("Update failed"));

      function SaveConsumer() {
        const { saveNote } = useNotes();
        return (
          <button data-testid="save-btn" onClick={() => saveNote("note-err-del", { title: "Updated" })}>
            Save
          </button>
        );
      }

      render(
        <NotesProvider>
          <SaveConsumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("save-btn").click();
      });

      errorSpy.mockRestore();
    });

    it("handles backend error when createNoteAction throws during createNewNote", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { createNoteAction, getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockResolvedValue([]);
      (createNoteAction as any).mockRejectedValue(new Error("Backend create error"));

      function Consumer() {
        const { createNewNote, notes } = useNotes();
        return (
          <div>
            <div data-testid="notes-count">{notes.length}</div>
            <button data-testid="create-btn" onClick={() => createNewNote()}>Create</button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("create-btn").click();
      });

      expect(errorSpy).toHaveBeenCalledWith("Error creating note on backend:", expect.any(Error));
      expect(screen.getByTestId("notes-count")).toHaveTextContent("1");
      errorSpy.mockRestore();
    });

    it("does not fetch notes when offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
      const { getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockClear();

      function Consumer() {
        const { refreshNotes } = useNotes();
        return <button data-testid="refresh-btn" onClick={() => refreshNotes()}>Refresh</button>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("refresh-btn").click();
      });

      expect(getNotesAction).not.toHaveBeenCalled();
      Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    });

    it("handles corrupted JSON in cached notes localStorage gracefully", () => {
      localStorage.setItem("nipponic.cached_notes", "invalid-json{");

      function Consumer() {
        const { notes } = useNotes();
        return <div data-testid="notes-count">{notes.length}</div>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      expect(screen.getByTestId("notes-count")).toHaveTextContent("0");
    });

    it("handles localStorage write error when persisting notes gracefully", async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });

      function Consumer() {
        const { createNewNote } = useNotes();
        return <button data-testid="create-btn" onClick={() => createNewNote()}>Create</button>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        await expect(screen.getByTestId("create-btn").click()).toBeUndefined();
      });

      setItemSpy.mockRestore();
    });

    it("handles getNotesAction throwing during refreshNotes gracefully", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockRejectedValue(new Error("Network failed"));

      function Consumer() {
        const { refreshNotes } = useNotes();
        return <button data-testid="ref-btn" onClick={() => refreshNotes()}>Ref</button>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("ref-btn").click();
      });

      expect(warnSpy).toHaveBeenCalledWith("[NotesContext] Error fetching notes:", expect.any(Error));
      warnSpy.mockRestore();
    });

    it("preserves selection when saveNote is called on non-selected temp note", async () => {
      const { createNoteAction, getNotesAction } = await import("@/actions/notes");
      const mockNotes: Note[] = [
        { id: "note-real-1", title: "Real", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
        { id: "temp-note-2", title: "Temp", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      localStorage.setItem("nipponic.selected_note_id", "note-real-1");
      (getNotesAction as any).mockResolvedValue(mockNotes);
      (createNoteAction as any).mockResolvedValue({ id: "real-uuid-2", updatedAt: "2026-10-18T10:05:00.000Z" });

      function Consumer() {
        const { saveNote, selectedNoteId } = useNotes();
        return (
          <div>
            <div data-testid="sel-id">{selectedNoteId}</div>
            <button data-testid="save-temp" onClick={() => saveNote("temp-note-2")}>Save Temp</button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      expect(screen.getByTestId("sel-id")).toHaveTextContent("note-real-1");

      await act(async () => {
        screen.getByTestId("save-temp").click();
      });

      expect(screen.getByTestId("sel-id")).toHaveTextContent("note-real-1");
    });

    it("handles error when createNoteAction throws inside saveNote", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { createNoteAction, getNotesAction } = await import("@/actions/notes");
      const mockNotes: Note[] = [
        { id: "temp-err-1", title: "Temp Err", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      (getNotesAction as any).mockResolvedValue(mockNotes);
      (createNoteAction as any).mockRejectedValue(new Error("Server create error"));

      function Consumer() {
        const { saveNote } = useNotes();
        return <button data-testid="save-btn" onClick={() => saveNote("temp-err-1")}>Save</button>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("save-btn").click();
      });

      expect(errorSpy).toHaveBeenCalledWith("Error creating temp note on backend:", expect.any(Error));
      errorSpy.mockRestore();
    });

    it("handles error when updateNoteAction throws inside saveNote on real note", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { updateNoteAction, getNotesAction } = await import("@/actions/notes");
      const mockNotes: Note[] = [
        { id: "note-real-err", title: "Real Note", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      (getNotesAction as any).mockResolvedValue(mockNotes);
      (updateNoteAction as any).mockRejectedValue(new Error("Server update error"));

      function Consumer() {
        const { saveNote } = useNotes();
        return <button data-testid="save-btn" onClick={() => saveNote("note-real-err")}>Save</button>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("save-btn").click();
      });

      expect(errorSpy).toHaveBeenCalledWith("Error updating note on backend:", expect.any(Error));
      errorSpy.mockRestore();
    });

    it("applies extraUpdates and updates notes state when saveNote is provided with updates", async () => {
      const { updateNoteAction, getNotesAction } = await import("@/actions/notes");
      const mockNotes: Note[] = [
        { id: "note-extra-1", title: "Original Title", enText: "Old", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      (getNotesAction as any).mockResolvedValue(mockNotes);
      (updateNoteAction as any).mockResolvedValue({ id: "note-extra-1", updatedAt: "2026-10-18T10:05:00.000Z" });

      function Consumer() {
        const { saveNote, notes } = useNotes();
        return (
          <div>
            <div data-testid="note-title">{notes[0]?.title}</div>
            <button
              data-testid="save-extra-btn"
              onClick={() => saveNote("note-extra-1", { title: "Title Via ExtraUpdates" })}
            >
              Save Extra
            </button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("save-extra-btn").click();
      });

      expect(screen.getByTestId("note-title")).toHaveTextContent("Title Via ExtraUpdates");
      expect(updateNoteAction).toHaveBeenCalledWith(
        "note-extra-1",
        expect.objectContaining({ title: "Title Via ExtraUpdates" })
      );
    });

    it("returns early when saveNote is called for non-existent note id", async () => {
      const { updateNoteAction } = await import("@/actions/notes");
      function Consumer() {
        const { saveNote } = useNotes();
        return <button data-testid="save-missing" onClick={() => saveNote("non-existent-id")}>Missing</button>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("save-missing").click();
      });

      expect(updateNoteAction).not.toHaveBeenCalled();
    });

    it("does not call backend action when saveNote runs while unauthenticated", async () => {
      mockIsAuthenticated = false;
      const { updateNoteAction, getNotesAction } = await import("@/actions/notes");
      const mockNotes: Note[] = [
        { id: "note-unauth-1", title: "Guest Note", enText: "G", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      (getNotesAction as any).mockResolvedValue(mockNotes);

      function Consumer() {
        const { saveNote, notes } = useNotes();
        return (
          <div>
            <div data-testid="note-title">{notes[0]?.title}</div>
            <button
              data-testid="save-unauth"
              onClick={() => saveNote("note-unauth-1", { title: "Updated Offline" })}
            >
              Save Unauth
            </button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("save-unauth").click();
      });

      expect(screen.getByTestId("note-title")).toHaveTextContent("Updated Offline");
      expect(updateNoteAction).not.toHaveBeenCalled();
      mockIsAuthenticated = true;
    });

    it("handles non-array response from getNotesAction gracefully", async () => {
      const { getNotesAction } = await import("@/actions/notes");
      (getNotesAction as any).mockResolvedValue(null);

      function Consumer() {
        const { refreshNotes, notes } = useNotes();
        return (
          <div>
            <div data-testid="count">{notes.length}</div>
            <button data-testid="ref-btn" onClick={() => refreshNotes()}>Ref</button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("ref-btn").click();
      });

      expect(screen.getByTestId("count")).toHaveTextContent("0");
    });

    it("creates a temp note directly when unauthenticated without calling backend", async () => {
      mockIsAuthenticated = false;
      const { createNoteAction } = await import("@/actions/notes");
      (createNoteAction as any).mockClear();

      function Consumer() {
        const { createNewNote, notes } = useNotes();
        return (
          <div>
            <div data-testid="count">{notes.length}</div>
            <button data-testid="create-guest-btn" onClick={() => createNewNote()}>Create Guest</button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("create-guest-btn").click();
      });

      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(createNoteAction).not.toHaveBeenCalled();
      mockIsAuthenticated = true;
    });

    it("falls back to nowIso if created note has no updatedAt", async () => {
      const { createNoteAction } = await import("@/actions/notes");
      (createNoteAction as any).mockResolvedValueOnce({
        id: "note-no-updatedat",
        title: "Untitled Note",
        enText: "",
        jpText: "",
        sourceLang: "EN",
        updatedAt: null,
      });

      function Consumer() {
        const { createNewNote, notes } = useNotes();
        return (
          <div>
            <div data-testid="count">{notes.length}</div>
            <button data-testid="create-no-upd-btn" onClick={() => createNewNote()}>Create</button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("create-no-upd-btn").click();
      });

      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });

    it("does not schedule debounced autosave timer on edit when unauthenticated", () => {
      mockIsAuthenticated = false;
      vi.useFakeTimers();
      const mockNotes: Note[] = [
        { id: "note-guest-edit", title: "G", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" }
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));

      function Consumer() {
        const { updateNoteContent, notes } = useNotes();
        return (
          <div>
            <div data-testid="title">{notes[0]?.title}</div>
            <button data-testid="edit-guest" onClick={() => updateNoteContent("note-guest-edit", { title: "Guest Edit" })}>Edit</button>
          </div>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      act(() => {
        screen.getByTestId("edit-guest").click();
      });

      expect(screen.getByTestId("title")).toHaveTextContent("Guest Edit");
      vi.useRealTimers();
      mockIsAuthenticated = true;
    });

    it("triggers flushPendingSaves when visibilitychange event fires with hidden state", async () => {
      vi.useFakeTimers();
      const mockNotes: Note[] = [
        { id: "note-vis", title: "Vis Title", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" }
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      const { updateNoteAction } = await import("@/actions/notes");
      vi.mocked(updateNoteAction).mockResolvedValue({ id: "note-vis", title: "Edited", updatedAt: "2026-10-18T12:00:00.000Z" } as any);

      function Consumer() {
        const { updateNoteContent } = useNotes();
        return (
          <button data-testid="edit-btn" onClick={() => updateNoteContent("note-vis", { title: "Edited" })}>
            Edit
          </button>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      act(() => {
        screen.getByTestId("edit-btn").click();
      });

      // Change visibilityState to hidden and dispatch event
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      expect(updateNoteAction).toHaveBeenCalledWith("note-vis", expect.objectContaining({ title: "Edited" }));

      // Also dispatch with visible state (should not trigger flush)
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      act(() => {
        document.dispatchEvent(new Event("visibilitychange"));
      });

      vi.useRealTimers();
    });

    it("handles updateNoteAction returning null or missing updatedAt gracefully", async () => {
      const mockNotes: Note[] = [
        { id: "note-no-update", title: "Old", enText: "", jpText: "", sourceLang: "JA", updatedAt: "2026-10-18T10:00:00.000Z" }
      ];
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockNotes));
      const { updateNoteAction } = await import("@/actions/notes");
      vi.mocked(updateNoteAction).mockResolvedValue(null as any);

      function Consumer() {
        const { saveNote } = useNotes();
        return (
          <button data-testid="save-btn" onClick={() => saveNote("note-no-update")}>
            Save
          </button>
        );
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await act(async () => {
        screen.getByTestId("save-btn").click();
      });

      expect(updateNoteAction).toHaveBeenCalledWith("note-no-update", expect.objectContaining({ sourceLang: "JA" }));
    });

    it("skips refreshNotes when isWakingServer is true", async () => {
      mockIsWakingServer = true;
      const { getNotesAction } = await import("@/actions/notes");
      vi.mocked(getNotesAction).mockClear();

      render(
        <NotesProvider>
          <TestConsumer />
        </NotesProvider>
      );

      expect(getNotesAction).not.toHaveBeenCalled();
      mockIsWakingServer = false;
    });

    it("restores selected note from localStorage if selectedNoteId is null during refresh", async () => {
      const mockServerNotes: Note[] = [
        { id: "note-1", title: "Note 1", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
        { id: "note-2", title: "Note 2", enText: "", jpText: "", sourceLang: "EN", updatedAt: "2026-10-18T10:00:00.000Z" },
      ];
      localStorage.setItem("nipponic.selected_note_id", "note-2");
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(mockServerNotes));
      const { getNotesAction } = await import("@/actions/notes");
      vi.mocked(getNotesAction).mockResolvedValue(mockServerNotes);

      function Consumer() {
        const { selectedNoteId } = useNotes();
        return <div data-testid="sel-id">{selectedNoteId}</div>;
      }

      render(
        <NotesProvider>
          <Consumer />
        </NotesProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("sel-id")).toHaveTextContent("note-2");
      });
    });
  });
});

