"use client";

import { useState, useCallback } from "react";
import type { WorkspaceProps } from "@nipponic/shared";

export type { WorkspaceProps };
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
import dynamic from "next/dynamic";
import { AppSidebar } from "@/components/app-sidebar";
import { BookOpen, GraduationCap, Layers, Loader2 } from "lucide-react";
import { useNotes } from "@/contexts/NotesContext";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { getGlossaryRules } from "@/services/glossary";

const TextEditor = dynamic(
  () => import("@/components/text-editor").then((mod) => mod.TextEditor),
  {
    loading: () => (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const DeckWorkspace = dynamic(
  () => import("@/components/deck-workspace").then((mod) => mod.DeckWorkspace),
  {
    loading: () => (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const TutorWorkspace = dynamic(
  () => import("@/components/tutor-workspace").then((mod) => mod.TutorWorkspace),
  {
    loading: () => (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    ),
    ssr: false,
  }
);

const FlashcardPlayer = dynamic(
  () => import("@/components/flashcard-player").then((mod) => mod.FlashcardPlayer),
  { ssr: false }
);

export function Workspace(props: WorkspaceProps = {}) {
  void props;
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

  const handleTranslate = useCallback(async () => {
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
  }, [selectedNote, updateNoteContent, saveNote]);

  const handleSelectNote = useCallback(
    (id: string) => setSelectedNoteId(id),
    [setSelectedNoteId]
  );

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (selectedNote) {
        updateNoteContent(selectedNote.id, { title: e.target.value });
      }
    },
    [selectedNote, updateNoteContent]
  );

  const handleTitleBlur = useCallback(() => {
    if (selectedNote) {
      saveNote(selectedNote.id);
    }
  }, [selectedNote, saveNote]);

  const handleChangeContent = useCallback(
    (newContent: string) => {
      if (selectedNote) {
        updateNoteContent(selectedNote.id, { enText: newContent });
      }
    },
    [selectedNote, updateNoteContent]
  );

  const handleBlurContent = useCallback(() => {
    if (selectedNote) {
      saveNote(selectedNote.id);
    }
  }, [selectedNote, saveNote]);

  const handleChangeJpContent = useCallback(
    (newJpContent: string) => {
      if (selectedNote) {
        updateNoteContent(selectedNote.id, { jpText: newJpContent });
      }
    },
    [selectedNote, updateNoteContent]
  );

  const handleBlurJpContent = useCallback(() => {
    if (selectedNote) {
      saveNote(selectedNote.id);
    }
  }, [selectedNote, saveNote]);

  const handleChangeSourceLang = useCallback(
    (newLang: "EN" | "JA") => {
      if (selectedNote) {
        updateNoteContent(selectedNote.id, { sourceLang: newLang });
        saveNote(selectedNote.id, { sourceLang: newLang });
      }
    },
    [selectedNote, updateNoteContent, saveNote]
  );

  return (
    <SidebarProvider>
      <AppSidebar
        selectedNoteId={selectedNoteId}
        onSelectNote={handleSelectNote}
      />

      <SidebarInset className="flex flex-col min-h-screen min-w-0 max-w-full overflow-x-hidden">
        <header className="flex min-h-14 items-center justify-between border-b px-3 sm:px-6 shrink-0 pt-safe">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <SidebarTrigger className="h-9 w-9 shrink-0 cursor-pointer" />
            {activeSidebarView === "notes" ? (
              selectedNote && (
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[140px] xs:max-w-[180px] sm:max-w-sm">
                  {selectedNote.title}
                </span>
              )
            ) : activeSidebarView === "flashcards" ? (
              selectedDeck && (
                <span className="text-sm font-medium text-muted-foreground truncate max-w-[140px] xs:max-w-[180px] sm:max-w-sm flex items-center gap-1.5 min-w-0">
                  <Layers size={15} className="text-primary shrink-0" />
                  <span className="truncate">{selectedDeck.name}</span>
                </span>
              )
            ) : (
              <span className="text-sm font-medium text-muted-foreground truncate max-w-[140px] xs:max-w-[180px] sm:max-w-sm flex items-center gap-1.5 min-w-0">
                <GraduationCap size={15} className="text-primary shrink-0" />
                <span>AI Tutor</span>
              </span>
            )}
          </div>
        </header>

        {activeSidebarView === "notes" ? (
          <div className="flex-1 p-3 sm:p-6 md:p-8 flex flex-col items-center justify-start w-full min-w-0 max-w-full pb-safe">
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
                  <Button className="w-full cursor-pointer" onClick={async () => { await createNewNote(); }}>
                    Create New Note
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full max-w-3xl flex-1 flex flex-col gap-4 sm:gap-6 justify-start min-w-0">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={handleTitleChange}
                  onBlur={handleTitleBlur}
                  className="text-2xl sm:text-3xl font-bold bg-transparent outline-none tracking-tight text-foreground border-b border-transparent focus:border-border pb-1 w-full"
                  placeholder="Note title..."
                />

                <Separator />

                <TextEditor
                  selectedNote={selectedNote}
                  onChangeContent={handleChangeContent}
                  onBlurContent={handleBlurContent}
                  onChangeJpContent={handleChangeJpContent}
                  onBlurJpContent={handleBlurJpContent}
                  onChangeSourceLang={handleChangeSourceLang}
                  isTranslating={isTranslating}
                  onTranslate={handleTranslate}
                />
              </div>
            )}
          </div>
        ) : activeSidebarView === "flashcards" ? (
          <div className="flex-1 flex flex-col items-center justify-start w-full min-w-0 max-w-full">
            <DeckWorkspace deck={selectedDeck} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-start w-full min-w-0 max-w-full">
            <TutorWorkspace />
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
