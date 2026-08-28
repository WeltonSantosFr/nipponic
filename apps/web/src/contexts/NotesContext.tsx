"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getNotesAction } from "@/actions/notes";
import { useAuth } from "./AuthContext";
import { Note } from "@nipponic/shared";

interface NotesContextData {
  notes: Note[];
  refreshNotes: () => Promise<void>;
}

const NotesContext = createContext<NotesContextData>({} as NotesContextData);

export function NotesProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);

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

  return (
    <NotesContext.Provider value={{ notes, refreshNotes }}>
      {children}
    </NotesContext.Provider>
  );
}

export const useNotes = () => useContext(NotesContext);