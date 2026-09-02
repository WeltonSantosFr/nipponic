import { useState } from "react";
import { TokenizedText } from "@/components/tokenized-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeech } from "@/hooks/use-speech";
import { Note } from "@nipponic/shared";
import {
  BookMarked,
  Check,
  Languages,
  Loader,
  Pencil,
  Volume2,
  VolumeX,
} from "lucide-react";
import { GlossaryModal } from "@/components/glossary-modal";

interface TextEditorProps {
  selectedNote: Note;
  onChangeContent: (newContent: string) => void;
  onBlurContent?: () => void;
  onChangeJpContent?: (newContent: string) => void;
  onBlurJpContent?: () => void;
  onTranslate: () => void;
  isTranslating: boolean;
}

export function TextEditor({
  selectedNote,
  onChangeContent,
  onBlurContent,
  onChangeJpContent,
  onBlurJpContent,
  onTranslate,
  isTranslating,
}: TextEditorProps) {
  const { speak, stop, isPlaying, activeLang } = useSpeech();
  const [isEditingJp, setIsEditingJp] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6 rounded-lg border bg-card text-card-foreground">
      {/* English Section */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Original (English)
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              disabled={!selectedNote.enText.trim()}
              onClick={() =>
                isPlaying && activeLang === "en-US"
                  ? stop()
                  : speak(selectedNote.enText, "en-US")
              }
              title="Listen in English"
            >
              {isPlaying && activeLang === "en-US" ? (
                <VolumeX className="h-4 w-4 text-primary animate-pulse" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsGlossaryOpen(true)}
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs h-8"
              title="Manage Translation Glossary"
            >
              <BookMarked size={14} />
              Glossary
            </Button>
            <Button
              onClick={onTranslate}
              size="sm"
              variant="secondary"
              className="gap-2 h-8"
              disabled={!selectedNote.enText.trim()}
            >
              <Languages size={16} />
              {isTranslating ? (
                <Loader className="animate-spin" size={16} />
              ) : (
                "Translate"
              )}
            </Button>
          </div>
        </div>

        <Textarea
          value={selectedNote.enText}
          onChange={(e) => onChangeContent(e.target.value)}
          onBlur={onBlurContent}
          placeholder="Start typing in English..."
          className="min-h-32 text-base resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent"
        />
      </div>

      {/* Japanese Section */}
      <div className="space-y-2 bg-muted/40 p-4 rounded-md border border-dashed">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Japanese (Translation)
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-primary"
              disabled={!selectedNote.jpText.trim()}
              onClick={() =>
                isPlaying && activeLang === "ja-JP"
                  ? stop()
                  : speak(selectedNote.jpText, "ja-JP", 0.9)
              }
              title="Listen in Japanese"
            >
              {isPlaying && activeLang === "ja-JP" ? (
                <VolumeX className="h-4 w-4 text-primary animate-pulse" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditingJp((prev) => !prev)}
            title={isEditingJp ? "Done editing" : "Edit Japanese text"}
          >
            {isEditingJp ? (
              <>
                <Check size={14} className="text-green-500" />
                <span className="text-green-600 font-medium">Done</span>
              </>
            ) : (
              <>
                <Pencil size={14} />
                <span>Edit Japanese</span>
              </>
            )}
          </Button>
        </div>

        {/* Japanese Content: Editable Textarea vs Tokenized Analyzer */}
        {isEditingJp ? (
          <div className="space-y-1">
            <Textarea
              value={selectedNote.jpText}
              onChange={(e) => onChangeJpContent?.(e.target.value)}
              onBlur={onBlurJpContent}
              placeholder="Type or adjust Japanese text..."
              className="min-h-24 text-base font-sans resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent text-foreground leading-relaxed"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground italic">
              * Manual edits are automatically saved on blur.
            </p>
          </div>
        ) : selectedNote.jpText ? (
          <TokenizedText text={selectedNote.jpText} />
        ) : (
          <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap">
            Click 'Translate' to generate the Japanese text...
          </p>
        )}
      </div>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />
    </div>
  );
}
