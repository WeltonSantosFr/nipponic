"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  getNotesAction,
  createNoteAction,
  updateNoteAction,
  deleteNoteAction,
} from "@/actions/notes";
import { useAuth } from "./AuthContext";
import { Note, UpdateNoteInput, NotesContextData } from "@nipponic/shared";

export type { NotesContextData };

const NotesContext = createContext<NotesContextData>({} as NotesContextData);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isWakingServer } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const isHydratedRef = useRef(false);
  const notesRef = useRef<Note[]>(notes);
  notesRef.current = notes;

  // Timers map for debounced autosaving
  const autosaveTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const handleSelectNoteId = useCallback((id: string | null) => {
    setSelectedNoteId(id);
    if (typeof window !== "undefined") {
      try {
        if (id) {
          localStorage.setItem("nipponic.selected_note_id", id);
        } else {
          localStorage.removeItem("nipponic.selected_note_id");
        }
      } catch {
        // Ignore localStorage write errors
      }
    }
  }, []);

  // Restore cached notes and active selected note from localStorage after client hydration
  useEffect(() => {
    try {
      const stored = localStorage.getItem("nipponic.cached_notes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotes(parsed);

          const storedSelectedId = localStorage.getItem(
            "nipponic.selected_note_id"
          );
          if (
            storedSelectedId &&
            parsed.some((n: Note) => n.id === storedSelectedId)
          ) {
            setSelectedNoteId(storedSelectedId);
          } else if (parsed[0]) {
            setSelectedNoteId(parsed[0].id);
          }
        }
      }
    } catch {
      // Ignore localStorage read errors
    } finally {
      isHydratedRef.current = true;
    }
  }, []);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const saveNote = useCallback(
    async (id: string, extraUpdates?: UpdateNoteInput) => {
      // Cancel any active debounced autosave timer for this note
      const existingTimer = autosaveTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        autosaveTimersRef.current.delete(id);
      }

      if (!isAuthenticated || id.startsWith("temp-")) return;

      const currentNote = notesRef.current.find((n) => n.id === id);
      if (!currentNote) return;

      const payload = {
        title: extraUpdates?.title ?? currentNote.title,
        enText: extraUpdates?.enText ?? currentNote.enText,
        jpText: extraUpdates?.jpText ?? currentNote.jpText,
        sourceLang: extraUpdates?.sourceLang ?? currentNote.sourceLang ?? "EN",
      };

      try {
        const updated = await updateNoteAction(id, payload);
        if (updated && updated.updatedAt) {
          setNotes((prevNotes) =>
            prevNotes.map((n) =>
              n.id === id ? { ...n, updatedAt: updated.updatedAt } : n
            )
          );
        }
      } catch (error) {
        console.error("Error updating note on backend:", error);
      }
    },
    [isAuthenticated]
  );

  // Flush all pending debounced saves on tab hide or before unload
  useEffect(() => {
    const flushPendingSaves = () => {
      autosaveTimersRef.current.forEach((timer, id) => {
        clearTimeout(timer);
        saveNote(id);
      });
      autosaveTimersRef.current.clear();
    };

    window.addEventListener("beforeunload", flushPendingSaves);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingSaves();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", flushPendingSaves);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushPendingSaves();
    };
  }, [saveNote]);

  const refreshNotes = useCallback(async () => {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      return;
    }
    if (isAuthenticated && !isWakingServer) {
      try {
        const data = await getNotesAction();
        if (Array.isArray(data)) {
          if (data.length === 0 && notesRef.current.length > 0) {
            console.warn(
              "[NotesContext] Received empty notes from server while having cached notes, preserving cache."
            );
            return;
          }

          // Smart merge: retain any offline or in-flight temp notes that aren't on the server yet
          const serverIds = new Set(data.map((n) => n.id));
          const localOnlyNotes = notesRef.current.filter(
            (n) => n.id.startsWith("temp-") && !serverIds.has(n.id)
          );

          const merged = [...localOnlyNotes, ...data];
          setNotes(merged);

          // Restore selection if selected note exists in merged list
          const currentSelectedId =
            selectedNoteId ||
            (typeof window !== "undefined"
              ? localStorage.getItem("nipponic.selected_note_id")
              : null);

          if (currentSelectedId && merged.some((n) => n.id === currentSelectedId)) {
            setSelectedNoteId(currentSelectedId);
          } else if (merged[0] && !selectedNoteId) {
            handleSelectNoteId(merged[0].id);
          }

          if (typeof window !== "undefined" && merged.length > 0) {
            try {
              localStorage.setItem(
                "nipponic.cached_notes",
                JSON.stringify(merged)
              );
            } catch {
              // Ignore localStorage write errors
            }
          }
        }
      } catch (err) {
        console.warn("[NotesContext] Error fetching notes:", err);
      }
    } else if (!isAuthenticated) {
      setNotes([]);
      handleSelectNoteId(null);
    }
  }, [isAuthenticated, isWakingServer, selectedNoteId, handleSelectNoteId]);

  useEffect(() => {
    if (!isWakingServer) {
      refreshNotes();
    }
  }, [refreshNotes, isWakingServer]);

  // Synchronize note updates with localStorage
  useEffect(() => {
    if (!isHydratedRef.current) return;
    if (typeof window !== "undefined" && notes.length > 0) {
      try {
        localStorage.setItem("nipponic.cached_notes", JSON.stringify(notes));
      } catch {
        // Ignore localStorage write errors
      }
    }
  }, [notes]);

  const createNewNote = async (): Promise<Note> => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const nowIso = new Date().toISOString();
    const newNote: Note = {
      id: tempId,
      title: "Untitled Note",
      enText: "",
      jpText: "",
      sourceLang: "EN",
      updatedAt: nowIso,
    };

    if (isAuthenticated) {
      try {
        const created = await createNoteAction({
          title: newNote.title,
          enText: newNote.enText,
          jpText: newNote.jpText,
          sourceLang: newNote.sourceLang,
        });

        if (created && created.id) {
          const finalNote: Note = {
            ...newNote,
            id: created.id,
            updatedAt: created.updatedAt || nowIso,
          };

          setNotes((prev) => [finalNote, ...prev]);
          handleSelectNoteId(finalNote.id);
          return finalNote;
        }
      } catch (error) {
        console.error("Error creating note on backend:", error);
      }
    }

    // Fallback for unauthenticated or offline creation
    setNotes((prev) => [newNote, ...prev]);
    handleSelectNoteId(tempId);
    return newNote;
  };

  const updateNoteContent = (id: string, updates: UpdateNoteInput) => {
    const nowIso = new Date().toISOString();
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...updates,
              updatedAt: nowIso,
            }
          : note
      )
    );

    // Schedule debounced autosave (500ms) for authenticated notes
    if (isAuthenticated && !id.startsWith("temp-")) {
      const existingTimer = autosaveTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        autosaveTimersRef.current.delete(id);
        saveNote(id);
      }, 500);

      autosaveTimersRef.current.set(id, timer);
    }
  };

  const deleteNote = async (id: string) => {
    // Clear any active autosave timer
    const existingTimer = autosaveTimersRef.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
      autosaveTimersRef.current.delete(id);
    }

    // Optimistic delete
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      handleSelectNoteId(null);
    }

    if (!isAuthenticated || id.startsWith("temp-")) return;

    try {
      await deleteNoteAction(id);
    } catch (error) {
      console.error("Error deleting note on backend:", error);
    }
  };

  return (
    <NotesContext.Provider
      value={{
        notes,
        selectedNoteId,
        selectedNote,
        setSelectedNoteId: handleSelectNoteId,
        createNewNote,
        updateNoteContent,
        saveNote,
        deleteNote,
        refreshNotes,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);