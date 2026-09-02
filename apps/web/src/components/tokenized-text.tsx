"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useKuromoji } from "@/hooks/use-kuromoji";
import { useSpeech } from "@/hooks/use-speech";
import {
  Check,
  Layers,
  Loader2,
  Pencil,
  RotateCcw,
  Scissors,
  Volume2,
  VolumeX,
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

interface TokenItemProps {
  word: string;
  nextWord?: string;
  isMerged?: boolean;
  onMergeWithNext?: () => void;
  onUnmerge?: () => void;
}

function TokenItem({
  word,
  nextWord,
  isMerged,
  onMergeWithNext,
  onUnmerge,
}: TokenItemProps) {
  const isPunctuation = /^[「」『』、。！？\s\(\)\[\]…:;,-]+$/.test(word);

  const [dictData, setDictData] = useState<DictionaryData | null>(
    () => getCachedDictionaryWord(word) ?? null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
          // Refetch fresh from Jisho/cache
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

    // Check if available in memory / localStorage cache synchronously
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
    } catch (err) {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (open) {
      fetchDictionaryData();
    } else {
      stop();
      setIsEditing(false);
    }
  };

  const handleStartEdit = () => {
    setEditReading(dictData?.reading || word);
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

  return (
    <HoverCard onOpenChange={handleOpenChange}>
      <HoverCardTrigger className="cursor-text transition-colors duration-150 hover:bg-primary/20 hover:text-primary rounded-sm px-0.5">
        {word}
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        sideOffset={6}
        className="w-72 z-50 shadow-lg min-h-28 flex flex-col p-4"
      >
        {isEditing ? (
          /* Form to edit definition */
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-2.5 text-xs">
            <div className="flex items-center justify-between border-b pb-1.5">
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
                placeholder="e.g. Zoro (One Piece character)"
                className="min-h-16 text-xs resize-none p-1.5"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                className="h-7 text-xs"
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs gap-1">
                <Check size={13} />
                Save
              </Button>
            </div>
          </form>
        ) : isLoading ? (
          <div className="flex flex-1 items-center justify-center py-4 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Searching definition...</span>
          </div>
        ) : hasError && !dictData ? (
          <div className="flex flex-col items-center justify-center py-3 text-muted-foreground gap-2">
            <span className="text-xs">No definition found.</span>
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartEdit}
                className="h-7 text-xs gap-1"
              >
                <Pencil size={12} />
                Add Meaning
              </Button>
              {isMerged && onUnmerge && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnmerge();
                  }}
                  className="h-7 text-xs text-destructive hover:bg-destructive/10 gap-1"
                >
                  <Scissors size={12} />
                  Split / Unmerge
                </Button>
              )}
            </div>
          </div>
        ) : dictData ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-2xl leading-none">{word}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-primary shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isPlaying) {
                        stop();
                      } else {
                        speak(dictData.reading || word, "ja-JP", 0.9);
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
                <span className="text-sm font-medium text-muted-foreground mt-0.5">
                  {dictData.reading}
                </span>
              </div>

              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleStartEdit}
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Edit or customize definition"
                  >
                    <Pencil size={13} />
                  </Button>

                  {dictData.isCustom ? (
                    <Badge
                      variant="default"
                      className="text-[10px] bg-purple-600 hover:bg-purple-700"
                    >
                      Custom
                    </Badge>
                  ) : (
                    <>
                      {dictData.isCommon && (
                        <Badge
                          variant="default"
                          className="text-[10px] bg-green-600/90 hover:bg-green-600"
                        >
                          Common
                        </Badge>
                      )}
                      {dictData.jlpt && (
                        <Badge variant="secondary" className="text-[10px]">
                          {dictData.jlpt}
                        </Badge>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Meanings List */}
            <div className="flex flex-col gap-1 border-t pt-2">
              {dictData.meanings.map((meaning, idx) => (
                <p key={idx} className="text-xs leading-snug">
                  <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                  {meaning}
                </p>
              ))}
            </div>

            {/* Merge / Unmerge actions */}
            <div className="border-t pt-2 mt-0.5 flex items-center justify-between gap-1">
              {isMerged && onUnmerge ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnmerge();
                  }}
                  className="h-6 text-[11px] text-muted-foreground hover:text-destructive gap-1 px-1.5"
                  title={`Split "${word}" back into separate words`}
                >
                  <Scissors size={12} />
                  Split / Unmerge
                </Button>
              ) : (
                <div />
              )}

              {nextWord && onMergeWithNext && !/^[「」『』、。！？\s]+$/.test(nextWord) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMergeWithNext();
                  }}
                  className="h-6 text-[11px] text-muted-foreground hover:text-primary gap-1 px-1.5"
                  title={`Group "${word}" with "${nextWord}" as a single word`}
                >
                  <Layers size={12} />
                  Merge with "{nextWord}"
                </Button>
              )}
            </div>
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}

export function TokenizedText({ text }: { text: string }) {
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
    <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap">
      {mergedTokens.map((token, index) => {
        const nextToken = mergedTokens[index + 1];
        return (
          <TokenItem
            key={`${index}-${token.surface_form}`}
            word={token.surface_form}
            nextWord={nextToken?.surface_form}
            isMerged={token.isMerged}
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


