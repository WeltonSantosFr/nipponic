"use client";

import { useState } from "react";
import { Note } from "@nipponic/shared";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BookOpen, Sparkles } from "lucide-react";
import { TextEditor } from "@/components/text-editor";
import { Toast } from "@/components/ui/toast";

interface WorkspaceProps {
  initialNotes: Note[];
}

export function Workspace({ initialNotes }: WorkspaceProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isTranslating, setIstranslating] = useState<boolean>(false);

  const selectedNote = notes.find((n) => n.id === selectedNoteId);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: `Untitled Note (${notes.length + 1})`,
      category: "Today",
      contentEn: "",
      contentJa: "",
      updatedAt: "Just now",
    };
    setNotes((prev) => [newNote, ...prev]);
    setSelectedNoteId(newNote.id);
  };

  const handleTranslate = async () => {
    setIstranslating(true);
    if (!selectedNote?.contentEn.trim()) return;

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedNote.contentEn,
          sourceLang: "EN",
          targetLang: "JA",
        }),
      });

      if (!response.ok) throw new Error("Error on request");

      const data = await response.json();

      setNotes((prev) =>
        prev.map((note) =>
          note.id === selectedNote.id
            ? { ...note, contentJa: data.translatedText }
            : note,
        ),
      );
    } catch (error) {
      console.error("Error on translating:", error);
    } finally {
      setIstranslating(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => setSelectedNoteId(id)}
        onNewNote={handleCreateNote}
      />

      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            {selectedNote && (
              <span className="text-sm font-medium text-muted-foreground">
                {selectedNote.title}
              </span>
            )}
          </div>

          {/* {selectedNote && (
            <Badge variant="outline" className="gap-1.5 py-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Auto-translation Active
            </Badge>
          )} */}
        </header>

        <main className="flex-1 p-8 flex flex-col items-center justify-center">
          {!selectedNote ? (
            <Card className="w-full max-w-md text-center shadow-sm">
              <CardHeader className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>No note selected</CardTitle>
                <CardDescription>
                  Select a note from the sidebar or create a new journal to
                  start studying.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleCreateNote} className="w-full">
                  Create New Note
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="w-full max-w-3xl flex-1 flex flex-col gap-6 justify-start">
              <input
                type="text"
                value={selectedNote.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setNotes((prev) =>
                    prev.map((n) =>
                      n.id === selectedNote.id ? { ...n, title: newTitle } : n,
                    ),
                  );
                }}
                className="text-3xl font-bold bg-transparent outline-none tracking-tight text-foreground border-b border-transparent focus:border-border pb-1"
                placeholder="Note title..."
              />

              <Separator />

              <TextEditor
                selectedNote={selectedNote}
                onChangeContent={(newContent) => {
                  setNotes((prev) =>
                    prev.map((note) =>
                      note.id === selectedNote.id
                        ? {
                            ...note,
                            contentEn: newContent,
                          }
                        : note,
                    ),
                  );
                }}
                isTranslating={isTranslating}
                onTranslate={handleTranslate}
              />
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
