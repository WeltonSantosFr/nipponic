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
import { Separator } from "@/components/ui/separator";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { BookOpen, Layers } from "lucide-react";
import { TextEditor } from "@/components/text-editor";
import { useNotes } from "@/contexts/NotesContext";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { getGlossaryRules } from "@/services/glossary";
import { DeckWorkspace } from "@/components/deck-workspace";
import { FlashcardPlayer } from "@/components/flashcard-player";

interface WorkspaceProps {
  initialNotes?: Note[];
}

export function Workspace({ initialNotes: _initialNotes }: WorkspaceProps = {}) {
  const {
    selectedNote,
    selectedNoteId,
    setSelectedNoteId,
    createNewNote,
    updateNoteContent,
    saveNote,
  } = useNotes();

  const {
    activeSidebarView,
    selectedDeck,
    playingDeck,
    stopPlayingDeck,
  } = useFlashCards();

  const [isTranslating, setIstranslating] = useState<boolean>(false);

  const handleTranslate = async () => {
    if (!selectedNote?.enText.trim()) return;
    setIstranslating(true);

    try {
      const glossaryRules = getGlossaryRules();
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: selectedNote.enText,
          sourceLang: "EN",
          targetLang: "JA",
          glossaryRules,
        }),
      });

      if (!response.ok) throw new Error("Error on request");

      const data = await response.json();
      const translatedText = data.translatedText;

      if (translatedText) {
        updateNoteContent(selectedNote.id, { jpText: translatedText });
        await saveNote(selectedNote.id, { jpText: translatedText });
      }
    } catch (error) {
      console.error("Error on translating:", error);
    } finally {
      setIstranslating(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar
        selectedNoteId={selectedNoteId}
        onSelectNote={(id) => setSelectedNoteId(id)}
      />

      <SidebarInset className="flex flex-col min-h-screen">
        <header className="flex h-14 items-center justify-between border-b px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            {activeSidebarView === "notes" ? (
              selectedNote && (
                <span className="text-sm font-medium text-muted-foreground truncate max-w-sm">
                  {selectedNote.title}
                </span>
              )
            ) : (
              selectedDeck && (
                <span className="text-sm font-medium text-muted-foreground truncate max-w-sm flex items-center gap-1.5">
                  <Layers size={15} className="text-primary" />
                  {selectedDeck.name}
                </span>
              )
            )}
          </div>
        </header>

        {activeSidebarView === "notes" ? (
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
                  <Button className="w-full cursor-pointer" onClick={() => createNewNote()}>
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
                    updateNoteContent(selectedNote.id, { title: e.target.value });
                  }}
                  onBlur={() => {
                    saveNote(selectedNote.id);
                  }}
                  className="text-3xl font-bold bg-transparent outline-none tracking-tight text-foreground border-b border-transparent focus:border-border pb-1"
                  placeholder="Note title..."
                />

                <Separator />

                <TextEditor
                  selectedNote={selectedNote}
                  onChangeContent={(newContent) => {
                    updateNoteContent(selectedNote.id, { enText: newContent });
                  }}
                  onBlurContent={() => {
                    saveNote(selectedNote.id);
                  }}
                  onChangeJpContent={(newJpContent) => {
                    updateNoteContent(selectedNote.id, { jpText: newJpContent });
                  }}
                  onBlurJpContent={() => {
                    saveNote(selectedNote.id);
                  }}
                  isTranslating={isTranslating}
                  onTranslate={handleTranslate}
                />
              </div>
            )}
          </main>
        ) : (
          <main className="flex-1 flex flex-col items-center justify-start">
            <DeckWorkspace deck={selectedDeck} />
          </main>
        )}
      </SidebarInset>

      {/* Interactive Modal Play Mode */}
      {playingDeck && (
        <FlashcardPlayer deck={playingDeck} onClose={stopPlayingDeck} />
      )}
    </SidebarProvider>
  );
}
