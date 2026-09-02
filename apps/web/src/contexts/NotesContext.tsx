"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
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
import { Note } from "@nipponic/shared";

interface NotesContextData {
  notes: Note[];
  selectedNoteId: string | null;
  selectedNote: Note | undefined;
  setSelectedNoteId: (id: string | null) => void;
  createNewNote: () => Promise<Note>;
  updateNoteContent: (
    id: string,
    updates: Partial<Pick<Note, "title" | "enText" | "jpText">>
  ) => void;
  saveNote: (
    id: string,
    extraUpdates?: Partial<Pick<Note, "title" | "enText" | "jpText">>
  ) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  refreshNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextData>({} as NotesContextData);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  const notesRef = useRef<Note[]>(notes);
  notesRef.current = notes;

  // Track in-flight creation promises by tempId to handle blur before creation finishes
  const pendingCreationsRef = useRef<Map<string, Promise<Note | null>>>(
    new Map()
  );

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const refreshNotes = async () => {
    if (isAuthenticated) {
      const data = await getNotesAction();
      setNotes(data);
    } else {
      setNotes([]);
    }
  };

  useEffect(() => {
    refreshNotes();
  }, [isAuthenticated]);

  const createNewNote = async (): Promise<Note> => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newNote: Note = {
      id: tempId,
      title: "Untitled Note",
      enText: "",
      jpText: "",
      updatedAt: new Date().toISOString(),
    };

    // Instant optimistic update on frontend
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(tempId);

    // If authenticated, sync with backend in the background
    if (isAuthenticated) {
      const creationPromise = (async () => {
        try {
          const created = await createNoteAction({
            title: newNote.title,
            enText: newNote.enText,
            jpText: newNote.jpText,
          });

          if (created && created.id) {
            // Update the temporary ID with the real backend ID while preserving any local edits
            setNotes((prevNotes) =>
              prevNotes.map((n) =>
                n.id === tempId
                  ? {
                      ...n,
                      id: created.id,
                      updatedAt: created.updatedAt || n.updatedAt,
                    }
                  : n
              )
            );

            // Keep the note selected using its real backend ID
            setSelectedNoteId((prevId) =>
              prevId === tempId ? created.id : prevId
            );

            return created;
          }
          return null;
        } catch (error) {
          console.error("Error creating note on backend:", error);
          return null;
        } finally {
          pendingCreationsRef.current.delete(tempId);
        }
      })();

      pendingCreationsRef.current.set(tempId, creationPromise);
    }

    return newNote;
  };

  const updateNoteContent = (
    id: string,
    updates: Partial<Pick<Note, "title" | "enText" | "jpText">>
  ) => {
    setNotes((prevNotes) =>
      prevNotes.map((note) =>
        note.id === id
          ? {
              ...note,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : note
      )
    );
  };

  const saveNote = async (
    id: string,
    extraUpdates?: Partial<Pick<Note, "title" | "enText" | "jpText">>
  ) => {
    if (!isAuthenticated) return;

    let targetId = id;

    // If the note is currently being created on the backend, wait for the real ID
    if (pendingCreationsRef.current.has(id)) {
      const created = await pendingCreationsRef.current.get(id);
      if (created && created.id) {
        targetId = created.id;
      } else {
        return;
      }
    }

    // Don't attempt to send PATCH to a temporary ID
    if (targetId.startsWith("temp-")) {
      return;
    }

    const currentNote = notesRef.current.find(
      (n) => n.id === targetId || n.id === id
    );
    if (!currentNote) return;

    const payload = {
      title: extraUpdates?.title ?? currentNote.title,
      enText: extraUpdates?.enText ?? currentNote.enText,
      jpText: extraUpdates?.jpText ?? currentNote.jpText,
    };

    try {
      const updated = await updateNoteAction(targetId, payload);
      if (updated && updated.updatedAt) {
        setNotes((prevNotes) =>
          prevNotes.map((n) =>
            n.id === targetId ? { ...n, updatedAt: updated.updatedAt } : n
          )
        );
      }
    } catch (error) {
      console.error("Error updating note on backend:", error);
    }
  };

  const deleteNote = async (id: string) => {
    // Optimistic delete
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
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
        setSelectedNoteId,
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