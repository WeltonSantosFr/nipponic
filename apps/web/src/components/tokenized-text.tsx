"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useKuromoji } from "@/hooks/use-kuromoji";
import { useSpeech } from "@/hooks/use-speech";
import { Loader2, Volume2, VolumeX } from "lucide-react";

interface DictionaryData {
  reading: string;
  meanings: string[];
  jlpt: string | null;
  isCommon: boolean;
}

function TokenItem({ word }: { word: string }) {
  const [dictData, setDictData] = useState<DictionaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { speak, stop, isPlaying } = useSpeech();

  const fetchDictionaryData = async () => {
    if (dictData || isLoading) return;

    setIsLoading(true);
    setHasError(false);

    try {
      const res = await fetch(
        `/api/dictionary?word=${encodeURIComponent(word)}`,
      );
      if (!res.ok) throw new Error("Não encontrado");

      const data = await res.json();
      setDictData(data);
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
    }
  };

  return (
    <HoverCard onOpenChange={handleOpenChange}>
      <HoverCardTrigger className="cursor-text transition-colors duration-150 hover:bg-primary/20 hover:text-primary rounded-sm px-px">
        {word}
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        sideOffset={6}
        className="w-64 z-50 shadow-lg min-h-25 flex flex-col"
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-4 text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Searching...</span>
          </div>
        ) : hasError ? (
          <div className="flex flex-1 items-center justify-center py-4 text-muted-foreground">
            <span className="text-sm">No definition found.</span>
          </div>
        ) : dictData ? (
          <div className="flex flex-col gap-3">
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
                <span className="text-sm font-medium text-muted-foreground mt-1">
                  {dictData.reading}
                </span>
              </div>

              {/* Badges alinhadas à direita */}
              <div className="flex flex-row items-end gap-1">
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
              </div>
            </div>

            {/* Renderização da lista de significados enumerada */}
            <div className="flex flex-col gap-1.5 mt-1 border-t pt-2">
              {dictData.meanings.map((meaning, idx) => (
                <p key={idx} className="text-sm leading-snug">
                  <span className="text-muted-foreground text-xs mr-1">
                    {idx + 1}.
                  </span>
                  {meaning}
                </p>
              ))}
            </div>
          </div>
        ) : null}
      </HoverCardContent>
    </HoverCard>
  );
}

export function TokenizedText({ text }: { text: string }) {
  const tokenizer = useKuromoji();

  if (!tokenizer) {
    return (
      <p className="text-base font-sans whitespace-pre-wrap text-muted-foreground animate-pulse">
        Loading Japanese analyzer...
      </p>
    );
  }

  const tokens = tokenizer.tokenize(text);

  return (
    <p className="text-base text-foreground leading-relaxed font-sans whitespace-pre-wrap">
      {tokens.map((token, index) => (
        <TokenItem
          key={`${index}-${token.surface_form}`}
          word={token.surface_form}
        />
      ))}
    </p>
  );
}
