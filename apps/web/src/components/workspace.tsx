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
    if (!selectedNote) return;
    const sourceLang = selectedNote.sourceLang || "EN";
    const textToTranslate =
      sourceLang === "JA" ? selectedNote.jpText : selectedNote.enText;

    if (!textToTranslate.trim()) return;
    setIstranslating(true);

    try {
      const glossaryRules = getGlossaryRules();
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLang: sourceLang,
          targetLang: sourceLang === "JA" ? "EN" : "JA",
          glossaryRules,
        }),
      });

      if (!response.ok) throw new Error("Error on request");

      const data = await response.json();
      const translatedText = data.translatedText;

      if (translatedText) {
        if (sourceLang === "JA") {
          updateNoteContent(selectedNote.id, { enText: translatedText });
          await saveNote(selectedNote.id, { enText: translatedText });
        } else {
          updateNoteContent(selectedNote.id, { jpText: translatedText });
          await saveNote(selectedNote.id, { jpText: translatedText });
        }
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

      <SidebarInset className="flex flex-col min-h-screen min-w-0 max-w-full overflow-x-hidden">
        <header className="flex h-14 items-center justify-between border-b px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger />
            {activeSidebarView === "notes" ? (
              selectedNote && (
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[180px] sm:max-w-sm">
                  {selectedNote.title}
                </span>
              )
            ) : (
              selectedDeck && (
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[180px] sm:max-w-sm flex items-center gap-1.5">
                  <Layers size={15} className="text-primary shrink-0" />
                  <span className="truncate">{selectedDeck.name}</span>
                </span>
              )
            )}
          </div>
        </header>

        {activeSidebarView === "notes" ? (
          <div className="flex-1 p-3 sm:p-6 md:p-8 flex flex-col items-center justify-start w-full min-w-0 max-w-full">
            {!selectedNote ? (
              <Card className="w-full max-w-md text-center shadow-sm my-auto">
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
              <div className="w-full max-w-3xl flex-1 flex flex-col gap-4 sm:gap-6 justify-start min-w-0">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => {
                    updateNoteContent(selectedNote.id, { title: e.target.value });
                  }}
                  onBlur={() => {
                    saveNote(selectedNote.id);
                  }}
                  className="text-2xl sm:text-3xl font-bold bg-transparent outline-none tracking-tight text-foreground border-b border-transparent focus:border-border pb-1 w-full"
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
                  onChangeSourceLang={(newLang) => {
                    updateNoteContent(selectedNote.id, { sourceLang: newLang });
                    saveNote(selectedNote.id, { sourceLang: newLang });
                  }}
                  isTranslating={isTranslating}
                  onTranslate={handleTranslate}
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-start w-full min-w-0 max-w-full">
            <DeckWorkspace deck={selectedDeck} />
          </div>
        )}
      </SidebarInset>

      {/* Interactive Modal Play Mode */}
      {playingDeck && (
        <FlashcardPlayer deck={playingDeck} onClose={stopPlayingDeck} />
      )}
    </SidebarProvider>
  );
}
