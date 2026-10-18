"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
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

const persistNotes = (notesList: Note[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("nipponic.cached_notes", JSON.stringify(notesList));
    } catch {
      // Ignore localStorage write errors
    }
  }
};

const getStoredNotes = (): Note[] => {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("nipponic.cached_notes");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore localStorage read errors
    }
  }
  return [];
};

export function NotesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, isWakingServer } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const isHydratedRef = useRef(false);
  const notesRef = useRef<Note[]>([]);

  // Keep notesRef in sync with notes state
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

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

  // Restore cached notes and active selected note from localStorage immediately after client mount
  useEffect(() => {
    const cached = getStoredNotes();
    if (cached.length > 0) {
      setNotes(cached);
      notesRef.current = cached;

      const storedSelectedId = localStorage.getItem("nipponic.selected_note_id");
      if (storedSelectedId && cached.some((n) => n.id === storedSelectedId)) {
        setSelectedNoteId(storedSelectedId);
      } else if (cached[0]) {
        setSelectedNoteId(cached[0].id);
      }
    }
    isHydratedRef.current = true;
  }, []);

  const selectedNote = useMemo(
    () => notes.find((n) => n.id === selectedNoteId),
    [notes, selectedNoteId]
  );

  const saveNote = useCallback(
    async (id: string, extraUpdates?: UpdateNoteInput) => {
      // Cancel any active debounced autosave timer for this note
      const existingTimer = autosaveTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        autosaveTimersRef.current.delete(id);
      }

      const currentList = notesRef.current.length > 0 ? notesRef.current : getStoredNotes();
      const currentNote = currentList.find((n) => n.id === id);
      if (!currentNote) return;

      let noteToSave = currentNote;
      if (extraUpdates) {
        noteToSave = {
          ...currentNote,
          ...extraUpdates,
          updatedAt: new Date().toISOString(),
        };
        const updatedList = currentList.map((n) => (n.id === id ? noteToSave : n));
        setNotes(updatedList);
        notesRef.current = updatedList;
        persistNotes(updatedList);
      }

      if (!isAuthenticated) return;

      // If this is a temporary note, sync creation with backend now
      if (id.startsWith("temp-")) {
        try {
          const created = await createNoteAction({
            title: noteToSave.title,
            enText: noteToSave.enText,
            jpText: noteToSave.jpText,
            sourceLang: noteToSave.sourceLang ?? "EN",
          });

          if (created && created.id) {
            setNotes((prevNotes) => {
              const swapped = prevNotes.map((n) =>
                n.id === id
                  ? {
                      ...n,
                      id: created.id,
                      updatedAt: created.updatedAt || n.updatedAt,
                    }
                  : n
              );
              notesRef.current = swapped;
              persistNotes(swapped);
              return swapped;
            });

            setSelectedNoteId((prevId) => {
              if (prevId === id) {
                handleSelectNoteId(created.id);
                return created.id;
              }
              return prevId;
            });
          }
        } catch (error) {
          console.error("Error creating temp note on backend:", error);
        }
        return;
      }

      // Normal note update on backend
      const payload = {
        title: noteToSave.title,
        enText: noteToSave.enText,
        jpText: noteToSave.jpText,
        sourceLang: noteToSave.sourceLang ?? "EN",
      };

      try {
        const updated = await updateNoteAction(id, payload);
        if (updated && updated.updatedAt) {
          setNotes((prevNotes) => {
            const next = prevNotes.map((n) =>
              n.id === id ? { ...n, updatedAt: updated.updatedAt } : n
            );
            notesRef.current = next;
            persistNotes(next);
            return next;
          });
        }
      } catch (error) {
        console.error("Error updating note on backend:", error);
      }
    },
    [isAuthenticated, handleSelectNoteId]
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
    if (!isAuthenticated || isWakingServer) {
      return;
    }

    try {
      const data = await getNotesAction();
      if (Array.isArray(data)) {
        let currentLocal = notesRef.current;
        if (currentLocal.length === 0) {
          currentLocal = getStoredNotes();
        }

        // If server returns empty list but we have local notes, preserve cache
        if (data.length === 0 && currentLocal.length > 0) {
          console.warn(
            "[NotesContext] Received empty notes from server while having cached notes, preserving cache."
          );
          return;
        }

        // Retain any offline or temp notes that aren't on the server yet
        const serverIds = new Set(data.map((n) => n.id));
        const localOnlyNotes = currentLocal.filter(
          (n) => n.id.startsWith("temp-") && !serverIds.has(n.id)
        );

        const merged = [...localOnlyNotes, ...data];
        setNotes(merged);
        notesRef.current = merged;
        persistNotes(merged);

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
      }
    } catch (err) {
      console.warn("[NotesContext] Error fetching notes:", err);
    }
  }, [isAuthenticated, isWakingServer, selectedNoteId, handleSelectNoteId]);

  useEffect(() => {
    if (!isWakingServer && isHydratedRef.current) {
      refreshNotes();
    }
  }, [refreshNotes, isWakingServer]);

  const createNewNote = useCallback(async (): Promise<Note> => {
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

          setNotes((prev) => {
            const next = [finalNote, ...prev];
            notesRef.current = next;
            persistNotes(next);
            return next;
          });
          handleSelectNoteId(finalNote.id);
          return finalNote;
        }
      } catch (error) {
        console.error("Error creating note on backend:", error);
      }
    }

    // Fallback for unauthenticated, offline, or when backend action returns null
    setNotes((prev) => {
      const next = [newNote, ...prev];
      notesRef.current = next;
      persistNotes(next);
      return next;
    });
    handleSelectNoteId(tempId);
    return newNote;
  }, [isAuthenticated, handleSelectNoteId]);

  const updateNoteContent = useCallback(
    (id: string, updates: UpdateNoteInput) => {
      const nowIso = new Date().toISOString();
      setNotes((prevNotes) => {
        const next = prevNotes.map((note) =>
          note.id === id
            ? {
                ...note,
                ...updates,
                updatedAt: nowIso,
              }
            : note
        );
        notesRef.current = next;
        persistNotes(next);
        return next;
      });

      // Schedule debounced autosave (500ms) for backend sync
      if (isAuthenticated) {
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
    },
    [isAuthenticated, saveNote]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      // Clear any active autosave timer
      const existingTimer = autosaveTimersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        autosaveTimersRef.current.delete(id);
      }

      // Optimistic delete with instant persistence
      setNotes((prev) => {
        const next = prev.filter((n) => n.id !== id);
        notesRef.current = next;
        persistNotes(next);
        return next;
      });

      if (selectedNoteId === id) {
        handleSelectNoteId(null);
      }

      if (!isAuthenticated || id.startsWith("temp-")) return;

      try {
        await deleteNoteAction(id);
      } catch (error) {
        console.error("Error deleting note on backend:", error);
      }
    },
    [isAuthenticated, selectedNoteId, handleSelectNoteId]
  );

  const contextValue = useMemo(
    () => ({
      notes,
      selectedNoteId,
      selectedNote,
      setSelectedNoteId: handleSelectNoteId,
      createNewNote,
      updateNoteContent,
      saveNote,
      deleteNote,
      refreshNotes,
    }),
    [
      notes,
      selectedNoteId,
      selectedNote,
      handleSelectNoteId,
      createNewNote,
      updateNoteContent,
      saveNote,
      deleteNote,
      refreshNotes,
    ]
  );

  return (
    <NotesContext.Provider value={contextValue}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);