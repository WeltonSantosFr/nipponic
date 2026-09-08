"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKuromoji } from "@/hooks/use-kuromoji";
import { useSpeech } from "@/hooks/use-speech";
import { KanjiBreakdown } from "@/components/kanji-breakdown";
import { SentenceMinerModal } from "@/components/sentence-miner-modal";
import {
  Check,
  Layers,
  Loader2,
  Pencil,
  RotateCcw,
  Scissors,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  X,
} from "lucide-react";

import {
  DictionaryData,
  getCachedDictionaryWord,
  fetchDictionaryWord,
  saveCustomDefinition,
  resetCustomDefinition,
  CUSTOM_DICT_EVENT,
} from "@/services/dictionary-cache";
import {
  smartMergeTokens,
  useCompoundWords,
} from "@/services/compound-words";

export function toHiragana(str: string): string {
  if (!str) return "";
  return str.replace(/[\u30a1-\u30f6]/g, (match) => {
    const chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
}

function extractSentence(fullText: string, targetWord: string): string {
  if (!fullText) return targetWord;
  const sentences = fullText
    .split(/(?<=[。！？\n])/g)
    .map((s) => s.trim())
    .filter(Boolean);
  const matched = sentences.find((s) => s.includes(targetWord));
  return matched || fullText.trim();
}

interface TokenItemProps {
  word: string;
  reading?: string;
  nextWord?: string;
  isMerged?: boolean;
  showFurigana?: boolean;
  fullText?: string;
  enContext?: string;
  onMergeWithNext?: () => void;
  onUnmerge?: () => void;
}

function TokenItem({
  word,
  reading,
  nextWord,
  isMerged,
  showFurigana = false,
  fullText = "",
  enContext = "",
  onMergeWithNext,
  onUnmerge,
}: TokenItemProps) {
  const isPunctuation = /^[「」『』、。！？\s\(\)\[\]…:;,-]+$/.test(word);
  const hasKanji = /[\u4e00-\u9faf]/.test(word);

  const [isOpen, setIsOpen] = useState(false);
  const [dictData, setDictData] = useState<DictionaryData | null>(
    () => getCachedDictionaryWord(word) ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<"def" | "kanji">("def");
  const [isMinerOpen, setIsMinerOpen] = useState(false);

  // Edit form state
  const [editReading, setEditReading] = useState("");
  const [editMeanings, setEditMeanings] = useState("");
  const [editTag, setEditTag] = useState("");

  const { speak, stop, isPlaying } = useSpeech();

  // Listen for custom dictionary updates for this word
  useEffect(() => {
    const handleCustomDictUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.word === word) {
        if (customEvent.detail.reset) {
          setDictData(null);
          fetchDictionaryWord(word).then((data) => setDictData(data));
        } else if (customEvent.detail.data) {
          setDictData(customEvent.detail.data);
        }
      }
    };

    window.addEventListener(CUSTOM_DICT_EVENT, handleCustomDictUpdate);
    return () => {
      window.removeEventListener(CUSTOM_DICT_EVENT, handleCustomDictUpdate);
    };
  }, [word]);

  const fetchDictionaryData = async () => {
    if (dictData) return;

    const cached = getCachedDictionaryWord(word);
    if (cached) {
      setDictData(cached);
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const data = await fetchDictionaryWord(word);
      if (data) {
        setDictData(data);
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchDictionaryData();
    } else {
      stop();
      setIsEditing(false);
    }
  };

  const handleStartEdit = () => {
    setEditReading(dictData?.reading || reading || word);
    setEditMeanings(dictData?.meanings.join("\n") || "");
    setEditTag(dictData?.jlpt || (dictData?.isCustom ? "Custom" : ""));
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const meaningsList = editMeanings
      .split("\n")
      .map((m) => m.trim())
      .filter((m) => m.length > 0);

    const saved = saveCustomDefinition(word, {
      reading: editReading.trim() || word,
      meanings: meaningsList.length > 0 ? meaningsList : ["Custom meaning"],
      jlpt: editTag.trim() || null,
      isCommon: dictData?.isCommon ?? true,
    });

    setDictData(saved);
    setHasError(false);
    setIsEditing(false);
  };

  const handleResetToDefault = () => {
    resetCustomDefinition(word);
    setIsEditing(false);
  };

  if (isPunctuation) {
    return <span className="text-muted-foreground">{word}</span>;
  }

  const furiganaText = toHiragana(reading || dictData?.reading || "");
  const extractedSentence = extractSentence(fullText, word);

  return (
    <>
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger className="cursor-pointer transition-all duration-150 hover:bg-primary/20 hover:text-primary rounded-sm px-0.5 inline-block select-text outline-none data-open:bg-primary/25 data-open:text-primary">
          {showFurigana && hasKanji && furiganaText ? (
            <ruby className="inline-flex flex-col items-center leading-none text-center">
              <span className="text-[10px] text-muted-foreground font-normal select-none pb-0.5 leading-none">
                {furiganaText}
              </span>
              <span className="leading-tight">{word}</span>
            </ruby>
          ) : (
            word
          )}
        </PopoverTrigger>

        <PopoverContent
          side="top"
          sideOffset={8}
          align="center"
          className="w-[calc(100vw-2rem)] sm:w-92 max-w-sm h-[400px] max-h-[85vh] z-50 shadow-2xl rounded-2xl flex flex-col p-4 bg-popover text-popover-foreground border border-border/80 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
        >
          {isEditing ? (
            /* Form to edit definition */
            <form onSubmit={handleSaveEdit} className="flex flex-col h-full min-h-0 justify-between text-xs">
              <div className="flex items-center justify-between border-b pb-1.5 shrink-0">
                <span className="font-bold text-sm text-foreground">
                  Edit: {word}
                </span>
                {dictData?.isCustom && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetToDefault}
                    className="h-6 text-[11px] text-muted-foreground hover:text-destructive gap-1 px-1.5"
                    title="Restore original Jisho definition"
                  >
                    <RotateCcw size={12} />
                    Restore
                  </Button>
                )}
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto pr-1 py-1 space-y-2.5 custom-scrollbar">
                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">
                    Reading / Furigana
                  </label>
                  <Input
                    value={editReading}
                    onChange={(e) => setEditReading(e.target.value)}
                    placeholder="e.g. ゾロ"
                    className="h-7 text-xs"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">
                    Tag / Category (optional)
                  </label>
                  <Input
                    value={editTag}
                    onChange={(e) => setEditTag(e.target.value)}
                    placeholder="e.g. Proper Noun / JLPT N3"
                    className="h-7 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-muted-foreground font-medium">
                    Meanings (one per line)
                  </label>
                  <Textarea
                    value={editMeanings}
                    onChange={(e) => setEditMeanings(e.target.value)}
                    placeholder="e.g. Zoro (character)"
                    className="min-h-20 text-xs resize-none p-1.5"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-2 border-t shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-7 text-xs cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" className="h-7 text-xs gap-1 cursor-pointer">
                  <Check size={13} />
                  Save
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col h-full min-h-0 justify-between">
              {/* Top Header Row with Word, Audio & Close Button */}
              <div className="flex items-start justify-between gap-2 border-b pb-2 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-2xl font-japanese leading-none text-foreground">
                      {word}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0 cursor-pointer"
                      onClick={() => {
                        if (isPlaying) {
                          stop();
                        } else {
                          speak(dictData?.reading || reading || word, "ja-JP", 0.9);
                        }
                      }}
                      title="Listen to pronunciation"
                    >
                      {isPlaying ? (
                        <VolumeX className="h-3.5 w-3.5 text-primary animate-pulse" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                  {(dictData?.reading || reading) && (
                    <span className="text-xs font-medium text-muted-foreground font-japanese">
                      {dictData?.reading || reading}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartEdit}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Edit definition"
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleOpenChange(false)}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Close"
                  >
                    <X size={13} />
                  </Button>
                </div>
              </div>

              {/* Pinned Tab Switcher */}
              {hasKanji && (
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg text-xs font-medium border border-border/40 shrink-0 my-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("def")}
                    className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                      activeTab === "def"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Definition
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("kanji")}
                    className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === "kanji"
                        ? "bg-background text-foreground shadow-xs font-semibold text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <BookOpen size={12} />
                    <span>Kanji Breakdown</span>
                  </button>
                </div>
              )}

              {/* Scrollable Content Body with smooth custom scrollbar */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1.5 py-1 space-y-2 focus:outline-none custom-scrollbar">
                {activeTab === "kanji" && hasKanji ? (
                  <KanjiBreakdown word={word} />
                ) : isLoading ? (
                  <div className="flex flex-1 items-center justify-center py-8 text-muted-foreground gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-xs">Searching definition...</span>
                  </div>
                ) : hasError && !dictData ? (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground gap-2 text-center">
                    <span className="text-xs">No online definition found.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartEdit}
                      className="h-7 text-xs gap-1 cursor-pointer"
                    >
                      <Pencil size={12} />
                      Add Custom Meaning
                    </Button>
                  </div>
                ) : dictData ? (
                  <div className="flex flex-col gap-2">
                    {/* Tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {dictData.isCustom ? (
                        <Badge
                          variant="default"
                          className="text-[10px] bg-purple-600 hover:bg-purple-700 h-4"
                        >
                          Custom
                        </Badge>
                      ) : (
                        <>
                          {dictData.isCommon && (
                            <Badge
                              variant="default"
                              className="text-[10px] bg-emerald-600/90 hover:bg-emerald-600 h-4"
                            >
                              Common
                            </Badge>
                          )}
                          {dictData.jlpt && (
                            <Badge variant="secondary" className="text-[10px] h-4">
                              {dictData.jlpt}
                            </Badge>
                          )}
                        </>
                      )}
                    </div>

                    {/* Meanings List */}
                    <div className="flex flex-col gap-1.5 pt-0.5">
                      {dictData.meanings.map((meaning, idx) => (
                        <p key={idx} className="text-xs leading-relaxed text-foreground">
                          <span className="text-muted-foreground font-mono mr-1.5 text-[11px]">
                            {idx + 1}.
                          </span>
                          {meaning}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Bottom Action Footer */}
              <div className="border-t border-border/40 pt-2.5 flex items-center justify-between gap-1 shrink-0 mt-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    handleOpenChange(false);
                    setIsMinerOpen(true);
                  }}
                  className="h-7 text-xs gap-1.5 px-3 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs font-semibold"
                  title="Create a flashcard with this word and note sentence"
                >
                  <Sparkles size={12} />
                  <span>Create Flashcard</span>
                </Button>

                <div className="flex items-center gap-1">
                  {isMerged && onUnmerge ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onUnmerge();
                        handleOpenChange(false);
                      }}
                      className="h-6 text-[11px] text-muted-foreground hover:text-destructive gap-1 px-1.5"
                      title={`Split "${word}" back into separate words`}
                    >
                      <Scissors size={12} />
                      Split
                    </Button>
                  ) : null}

                  {nextWord &&
                    onMergeWithNext &&
                    !/^[「」『』、。！？\s]+$/.test(nextWord) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          onMergeWithNext();
                          handleOpenChange(false);
                        }}
                        className="h-6 text-[11px] text-muted-foreground hover:text-primary gap-1 px-1.5"
                        title={`Group "${word}" with "${nextWord}"`}
                      >
                        <Layers size={12} />
                        Merge
                      </Button>
                    )}
                </div>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {/* Sentence Miner Modal */}
      <SentenceMinerModal
        isOpen={isMinerOpen}
        onClose={() => setIsMinerOpen(false)}
        word={word}
        reading={dictData?.reading || reading}
        meanings={dictData?.meanings}
        sentenceJp={extractedSentence}
        sentenceEn={enContext}
      />
    </>
  );
}

export function TokenizedText({
  text,
  showFurigana = false,
  enContext = "",
}: {
  text: string;
  showFurigana?: boolean;
  enContext?: string;
}) {
  const tokenizer = useKuromoji();
  const { compounds, addCompound, removeCompound } = useCompoundWords();

  const mergedTokens = useMemo(() => {
    if (!tokenizer || !text) return [];
    const raw = tokenizer.tokenize(text);
    return smartMergeTokens(raw, compounds);
  }, [tokenizer, text, compounds]);

  if (!tokenizer) {
    return (
      <p className="text-base font-sans whitespace-pre-wrap text-muted-foreground animate-pulse">
        Loading Japanese morphological analyzer...
      </p>
    );
  }

  return (
    <p className="text-base text-foreground leading-loose font-sans whitespace-pre-wrap">
      {mergedTokens.map((token, index) => {
        const nextToken = mergedTokens[index + 1];
        return (
          <TokenItem
            key={`${index}-${token.surface_form}`}
            word={token.surface_form}
            reading={token.reading}
            nextWord={nextToken?.surface_form}
            isMerged={token.isMerged}
            showFurigana={showFurigana}
            fullText={text}
            enContext={enContext}
            onMergeWithNext={
              nextToken
                ? () => addCompound(token.surface_form + nextToken.surface_form)
                : undefined
            }
            onUnmerge={
              token.isMerged
                ? () => removeCompound(token.surface_form)
                : undefined
            }
          />
        );
      })}
    </p>
  );
}
