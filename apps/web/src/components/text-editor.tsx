"use client";

import { useState, useEffect } from "react";
import { TokenizedText } from "@/components/tokenized-text";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSpeech } from "@/hooks/use-speech";
import { Note, NoteSourceLang } from "@nipponic/shared";
import {
  ArrowLeftRight,
  ArrowRight,
  BookMarked,
  Check,
  Headphones,
  Languages,
  Loader,
  Pencil,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from "lucide-react";
import { GlossaryModal } from "@/components/glossary-modal";
import { ShadowingModal } from "@/components/shadowing-modal";

interface TextEditorProps {
  selectedNote: Note;
  onChangeContent: (newContent: string) => void;
  onBlurContent?: () => void;
  onChangeJpContent?: (newContent: string) => void;
  onBlurJpContent?: () => void;
  onChangeSourceLang?: (newLang: NoteSourceLang) => void;
  onTranslate: () => void;
  isTranslating: boolean;
}

export function TextEditor({
  selectedNote,
  onChangeContent,
  onBlurContent,
  onChangeJpContent,
  onBlurJpContent,
  onChangeSourceLang,
  onTranslate,
  isTranslating,
}: TextEditorProps) {
  const { speak, stop, isPlaying, activeLang } = useSpeech();
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);
  const [isShadowingOpen, setIsShadowingOpen] = useState(false);
  const [jpAudioSpeed, setJpAudioSpeed] = useState<number>(0.9);
  const [showFurigana, setShowFurigana] = useState<boolean>(true);

  const sourceLang = selectedNote.sourceLang || "EN";
  const isEnToJp = sourceLang === "EN";

  // Reset target edit mode when switching direction
  useEffect(() => {
    setIsEditingTarget(false);
  }, [sourceLang]);

  // Load and persist Furigana toggle preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nipponic.furigana_enabled");
      if (saved !== null) {
        setShowFurigana(saved === "true");
      }
    } catch {
      // Ignore localStorage read error
    }
  }, []);

  const handleToggleFurigana = () => {
    setShowFurigana((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("nipponic.furigana_enabled", String(next));
      } catch {
        // Ignore localStorage write error
      }
      return next;
    });
  };

  const isSourceEmpty = isEnToJp
    ? !selectedNote.enText.trim()
    : !selectedNote.jpText.trim();

  return (
    <div className="flex flex-col gap-5 sm:gap-6 p-4 sm:p-6 rounded-lg border bg-card text-card-foreground shadow-xs w-full min-w-0">
      {/* Top Header / Direction Toggle Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-border/60">
        <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
          {/* Translation Direction Toggle Switch */}
          <div className="flex-1 sm:flex-none flex items-center bg-muted/70 p-1 rounded-lg border border-border/60 text-xs font-semibold min-w-0">
            <button
              type="button"
              onClick={() => onChangeSourceLang?.("EN")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer truncate ${
                isEnToJp
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="sm:hidden">EN</span>
              <span className="hidden sm:inline">English</span>
              <ArrowRight size={12} className={isEnToJp ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
              <span className="sm:hidden">JA</span>
              <span className="hidden sm:inline">Japanese</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeSourceLang?.("JA")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md transition-all cursor-pointer truncate ${
                !isEnToJp
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="sm:hidden">JA</span>
              <span className="hidden sm:inline">Japanese</span>
              <ArrowRight size={12} className={!isEnToJp ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
              <span className="sm:hidden">EN</span>
              <span className="hidden sm:inline">English</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            onClick={() => onChangeSourceLang?.(isEnToJp ? "JA" : "EN")}
            title="Swap translation direction"
          >
            <ArrowLeftRight size={14} />
            <span className="sr-only">Swap language direction</span>
          </Button>
        </div>

        <div className="flex items-center justify-end gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setIsGlossaryOpen(true)}
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 cursor-pointer flex-1 sm:flex-none justify-center"
            title="Manage Translation Glossary"
          >
            <BookMarked size={14} />
            <span>Glossary</span>
          </Button>
          <Button
            onClick={onTranslate}
            size="sm"
            variant="secondary"
            className="gap-2 h-8 cursor-pointer flex-1 sm:flex-none justify-center font-medium"
            disabled={isSourceEmpty}
          >
            <Languages size={15} />
            {isTranslating ? (
              <Loader className="animate-spin" size={15} />
            ) : (
              <span>Translate</span>
            )}
          </Button>
        </div>
      </div>

      {/* Source Section (Top Input) */}
      {isEnToJp ? (
        /* Original: English */
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Original (English)
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
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
          </div>

          <Textarea
            value={selectedNote.enText}
            onChange={(e) => onChangeContent(e.target.value)}
            onBlur={onBlurContent}
            placeholder="Start typing in English..."
            className="min-h-28 sm:min-h-32 text-base resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent break-words w-full"
          />
        </div>
      ) : (
        /* Original: Japanese */
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Original (Japanese)
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer"
                disabled={!selectedNote.jpText.trim()}
                onClick={() =>
                  isPlaying && activeLang === "ja-JP"
                    ? stop()
                    : speak(selectedNote.jpText, "ja-JP", jpAudioSpeed)
                }
                title={`Listen in Japanese (${jpAudioSpeed}x)`}
              >
                {isPlaying && activeLang === "ja-JP" ? (
                  <VolumeX className="h-4 w-4 text-primary animate-pulse" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>

              {/* Speed Selector */}
              {selectedNote.jpText.trim() && (
                <div className="flex items-center bg-background rounded p-0.5 border border-border/60 text-[10px] font-mono">
                  {[0.75, 0.9, 1.0, 1.25].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setJpAudioSpeed(rate)}
                      className={`px-1 py-0.2 rounded transition-colors cursor-pointer ${
                        jpAudioSpeed === rate
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Shadowing Studio Trigger */}
              {selectedNote.jpText.trim() && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsShadowingOpen(true)}
                  className="h-7 text-xs gap-1.5 text-foreground hover:text-primary cursor-pointer"
                  title="Practice speaking with Shadowing Studio"
                >
                  <Headphones size={13} className="text-primary" />
                  <span>Shadowing</span>
                </Button>
              )}
            </div>
          </div>

          <Textarea
            value={selectedNote.jpText}
            onChange={(e) => onChangeJpContent?.(e.target.value)}
            onBlur={onBlurJpContent}
            placeholder="Start typing in Japanese (日本語で入力)..."
            className="min-h-28 sm:min-h-32 text-base font-sans resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent text-foreground leading-relaxed font-japanese break-words w-full"
          />
        </div>
      )}

      {/* Target Section (Bottom Translation Card) */}
      <div className="space-y-2 bg-muted/40 p-3.5 sm:p-4 rounded-md border border-dashed w-full min-w-0 overflow-hidden">
        {isEnToJp ? (
          /* Target: Japanese (Translation) */
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Japanese (Translation)
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer"
                  disabled={!selectedNote.jpText.trim()}
                  onClick={() =>
                    isPlaying && activeLang === "ja-JP"
                      ? stop()
                      : speak(selectedNote.jpText, "ja-JP", jpAudioSpeed)
                  }
                  title={`Listen in Japanese (${jpAudioSpeed}x)`}
                >
                  {isPlaying && activeLang === "ja-JP" ? (
                    <VolumeX className="h-4 w-4 text-primary animate-pulse" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>

                {/* Speed Selector */}
                {selectedNote.jpText.trim() && (
                  <div className="flex items-center bg-background rounded p-0.5 border border-border/60 text-[10px] font-mono">
                    {[0.75, 0.9, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setJpAudioSpeed(rate)}
                        className={`px-1 py-0.2 rounded transition-colors cursor-pointer ${
                          jpAudioSpeed === rate
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Furigana Toggle Button */}
                {selectedNote.jpText.trim() && !isEditingTarget && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleToggleFurigana}
                    className={`h-7 text-xs gap-1.5 cursor-pointer ${
                      showFurigana
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "text-muted-foreground"
                    }`}
                    title={
                      showFurigana
                        ? "Hide Furigana readings"
                        : "Show Furigana readings above Kanji"
                    }
                  >
                    {showFurigana ? <Eye size={13} /> : <EyeOff size={13} />}
                    <span>Furigana</span>
                  </Button>
                )}

                {/* Shadowing Practice Studio Trigger */}
                {selectedNote.jpText.trim() && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsShadowingOpen(true)}
                    className="h-7 text-xs gap-1.5 text-foreground hover:text-primary cursor-pointer"
                    title="Practice speaking with Shadowing Studio"
                  >
                    <Headphones size={13} className="text-primary" />
                    <span>Shadowing</span>
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setIsEditingTarget((prev) => !prev)}
                  title={isEditingTarget ? "Done editing" : "Edit Japanese text"}
                >
                  {isEditingTarget ? (
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
            </div>

            {/* Japanese Content: Editable Textarea vs Tokenized Analyzer with Furigana */}
            {isEditingTarget ? (
              <div className="space-y-1">
                <Textarea
                  value={selectedNote.jpText}
                  onChange={(e) => onChangeJpContent?.(e.target.value)}
                  onBlur={onBlurJpContent}
                  placeholder="Type or adjust Japanese text..."
                  className="min-h-24 text-base font-sans resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent text-foreground leading-relaxed font-japanese break-words w-full"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground italic">
                  * Manual edits are automatically saved on blur.
                </p>
              </div>
            ) : selectedNote.jpText ? (
              <div className="py-1 w-full min-w-0 overflow-x-hidden">
                <TokenizedText
                  text={selectedNote.jpText}
                  showFurigana={showFurigana}
                  enContext={selectedNote.enText}
                />
              </div>
            ) : (
              <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap">
                Click &apos;Translate&apos; to generate the Japanese text...
              </p>
            )}
          </>
        ) : (
          /* Target: English (Translation) */
          <>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  English (Translation)
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer"
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
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={() => setIsEditingTarget((prev) => !prev)}
                  title={isEditingTarget ? "Done editing" : "Edit English translation"}
                >
                  {isEditingTarget ? (
                    <>
                      <Check size={14} className="text-green-500" />
                      <span className="text-green-600 font-medium">Done</span>
                    </>
                  ) : (
                    <>
                      <Pencil size={14} />
                      <span>Edit English</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* English Translation Content: Editable Textarea vs Rendered Text */}
            {isEditingTarget ? (
              <div className="space-y-1">
                <Textarea
                  value={selectedNote.enText}
                  onChange={(e) => onChangeContent(e.target.value)}
                  onBlur={onBlurContent}
                  placeholder="Type or adjust English translation..."
                  className="min-h-24 text-base resize-none border-none rounded-none shadow-none focus-visible:ring-0 p-0 bg-transparent text-foreground leading-relaxed break-words w-full"
                  autoFocus
                />
                <p className="text-[11px] text-muted-foreground italic">
                  * Manual edits are automatically saved on blur.
                </p>
              </div>
            ) : selectedNote.enText ? (
              <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap py-1 break-words w-full">
                {selectedNote.enText}
              </p>
            ) : (
              <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap">
                Click &apos;Translate&apos; to generate the English translation...
              </p>
            )}
          </>
        )}
      </div>

      <GlossaryModal
        isOpen={isGlossaryOpen}
        onClose={() => setIsGlossaryOpen(false)}
      />

      <ShadowingModal
        isOpen={isShadowingOpen}
        onClose={() => setIsShadowingOpen(false)}
        jpText={selectedNote.jpText}
        enText={selectedNote.enText}
      />
    </div>
  );
}
