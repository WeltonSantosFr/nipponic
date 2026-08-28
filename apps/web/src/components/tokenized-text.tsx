"use client";

import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Badge } from "@/components/ui/badge";
import { useKuromoji } from "@/hooks/use-kuromoji";
import { Loader2 } from "lucide-react";

interface DictionaryData {
  reading: string;
  meanings: string[];
  jlpt: string | null;
  isCommon: boolean;
}

function TokenItem({ word }: { word: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dictData, setDictData] = useState<DictionaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

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

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger>
        <span
          className={`cursor-text transition-colors duration-150 hover:bg-primary/20 hover:text-primary rounded-sm px-px`}
          onMouseEnter={(e) => {
            // if (e.shiftKey) {
            setIsOpen(true);
            fetchDictionaryData();
            // }
          }}
          onMouseLeave={() => setIsOpen(false)}
        >
          {word}
        </span>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
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
                <span className="font-bold text-2xl leading-none">{word}</span>
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
