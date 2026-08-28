import { TokenizedText } from "@/components/tokenized-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Note } from "@nipponic/shared";
import { Languages, Loader } from "lucide-react";

interface TextEditorProps {
  selectedNote: Note;
  onChangeContent: (newContent: string) => void;
  onTranslate: () => void;
  isTranslating: boolean;
}

export function TextEditor({
  selectedNote,
  onChangeContent,
  onTranslate,
  isTranslating,
}: TextEditorProps) {
  return (
    <div className="flex flex-col gap-6 p-6 rounded-lg border bg-card text-card-foreground">
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Original (English)
          </p>
          <Button
            onClick={onTranslate}
            size="sm"
            variant="secondary"
            className="gap-2"
            disabled={!selectedNote.contentEn.trim()} // Desabilita se estiver vazio
          >
            <Languages size={16} />
            {isTranslating ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              "Translate"
            )}
          </Button>
        </div>

        <Textarea
          value={selectedNote.contentEn}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Start typing in English..."
          className="min-h-32 text-base resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent"
        />
      </div>

      <div className="space-y-1 bg-muted/40 p-4 rounded-md border border-dashed">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Japanese (Translation)
        </p>
        {/* Substituímos a renderização crua pelo TokenizedText */}
        {selectedNote.contentJa ? (
          <TokenizedText text={selectedNote.contentJa} />
        ) : (
          <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap">
            Click 'Translate' to generate the Japanese text...
          </p>
        )}
      </div>
    </div>
  );
}
