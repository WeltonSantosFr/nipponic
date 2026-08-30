import { TokenizedText } from "@/components/tokenized-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeech } from "@/hooks/use-speech";
import { Note } from "@nipponic/shared";
import { Languages, Loader, Volume2, VolumeX } from "lucide-react";

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
  console.log(selectedNote);
  const { speak, stop, isPlaying, activeLang } = useSpeech();
  return (
    <div className="flex flex-col gap-6 p-6 rounded-lg border bg-card text-card-foreground">
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
          <Button
            onClick={onTranslate}
            size="sm"
            variant="secondary"
            className="gap-2"
            disabled={!selectedNote.enText.trim()} // Desabilita se estiver vazio
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
          value={selectedNote.enText}
          onChange={(e) => onChangeContent(e.target.value)}
          placeholder="Start typing in English..."
          className="min-h-32 text-base resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent"
        />
      </div>

      <div className="space-y-1 bg-muted/40 p-4 rounded-md border border-dashed">
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
        {/* Substituímos a renderização crua pelo TokenizedText */}
        {selectedNote.jpText ? (
          <TokenizedText text={selectedNote.jpText} />
        ) : (
          <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap">
            Click 'Translate' to generate the Japanese text...
          </p>
        )}
      </div>
    </div>
  );
}
