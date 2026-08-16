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
  meaning: string;
  jlpt: string | null;
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
          className={`cursor-text transition-colors duration-150 hover:bg-primary/20 hover:text-primary rounded-sm px-[1px]`}
          onMouseEnter={(e) => {
            if (e.shiftKey) {
              setIsOpen(true);
              fetchDictionaryData();
            }
          }}
          onMouseLeave={() => setIsOpen(false)}
        >
          {word}
        </span>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        className="w-64 z-50 shadow-lg min-h-[100px] flex flex-col"
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
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-2xl leading-none">{word}</span>
              {dictData.jlpt && (
                <Badge variant="secondary">{dictData.jlpt}</Badge>
              )}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {dictData.reading}
            </span>
            <p className="text-sm mt-2 leading-snug">{dictData.meaning}</p>
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
