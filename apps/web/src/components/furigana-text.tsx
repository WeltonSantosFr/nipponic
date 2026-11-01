"use client";

import React, { memo, useMemo } from "react";
import { useKuromoji } from "@/hooks/use-kuromoji";
import { toHiragana, TokenItem } from "@/components/tokenized-text";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { extractFlashcardWords, isWordInFlashcards } from "@/lib/flashcard-words";

export interface FuriganaTextProps {
  text: string;
  showFurigana?: boolean;
  className?: string;
  interactive?: boolean;
  enContext?: string;
}

interface Segment {
  type: "ruby" | "plain";
  kanji?: string;
  reading?: string;
  text?: string;
}

interface TokenFeatures {
  surface_form: string;
  reading?: string;
  basic_form?: string;
}

const plainTokenCache = new Map<string, TokenFeatures[]>();
const MAX_CACHE_SIZE = 500;

function getCachedTokens(
  tokenizer: { tokenize: (text: string) => { surface_form: string; reading?: string; basic_form?: string }[] },
  text: string
): TokenFeatures[] {
  const cached = plainTokenCache.get(text);
  if (cached) return cached;
  const rawTokens = tokenizer.tokenize(text);
  const tokens: TokenFeatures[] = rawTokens.map((t) => ({
    surface_form: t.surface_form,
    reading: t.reading,
    basic_form: t.basic_form,
  }));
  if (plainTokenCache.size >= MAX_CACHE_SIZE) {
    const firstKey = plainTokenCache.keys().next().value;
    if (firstKey) plainTokenCache.delete(firstKey);
  }
  plainTokenCache.set(text, tokens);
  return tokens;
}

/**
 * Parses a string that may contain markdown furigana {漢字|かんじ}
 * or HTML <ruby>漢字<rt>かんじ</rt></ruby> tags.
 */
function parseRubyMarkup(input: string): Segment[] {
  if (!input) return [];

  const segments: Segment[] = [];
  const regex = /(<ruby>[\s\S]*?<\/ruby>|\{[^{}|]+?\|[^{}|]+?\})/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(input)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "plain",
        text: input.slice(lastIndex, match.index),
      });
    }

    const raw = match[0];
    if (raw.startsWith("{") && raw.endsWith("}")) {
      const parts = raw.slice(1, -1).split("|");
      if (parts.length === 2 && parts[0] && parts[1]) {
        segments.push({
          type: "ruby",
          kanji: parts[0],
          reading: parts[1],
        });
      } else {
        segments.push({ type: "plain", text: raw });
      }
    } else if (raw.startsWith("<ruby>")) {
      const rtMatch = raw.match(/<ruby>([\s\S]*?)<rt>([\s\S]*?)<\/rt>[\s\S]*?<\/ruby>/i);
      if (rtMatch && rtMatch[1] && rtMatch[2]) {
        const kanji = rtMatch[1].replace(/<[^>]+>/g, "").trim();
        const reading = rtMatch[2].replace(/<[^>]+>/g, "").trim();
        segments.push({
          type: "ruby",
          kanji,
          reading,
        });
      } else {
        segments.push({ type: "plain", text: raw.replace(/<[^>]+>/g, "") });
      }
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < input.length) {
    segments.push({
      type: "plain",
      text: input.slice(lastIndex),
    });
  }

  return segments;
}

export const FuriganaText = memo(function FuriganaText({
  text,
  showFurigana = true,
  className = "",
  interactive = false,
  enContext = "",
}: FuriganaTextProps) {
  const tokenizer = useKuromoji();

  let flashcardWords: Set<string> | undefined;
  try {
    const flashCtx = useFlashCards();
    const userCards = [
      ...(flashCtx?.cards || []),
      ...(flashCtx?.decks || []).flatMap((d) => d.cards || []),
    ];
    flashcardWords = extractFlashcardWords(userCards);
  } catch {
    // If outside FlashCardsContext
  }

  const segments = useMemo(() => parseRubyMarkup(text), [text]);

  if (!text) return null;

  return (
    <span className={`inline-flex flex-wrap items-baseline gap-x-0.5 ${className}`.trim()}>
      {segments.map((seg, idx) => {
        if (seg.type === "ruby" && seg.kanji && seg.reading) {
          if (interactive) {
            const hasFc = flashcardWords
              ? isWordInFlashcards(seg.kanji, undefined, flashcardWords)
              : false;
            return (
              <TokenItem
                key={idx}
                word={seg.kanji}
                reading={seg.reading}
                showFurigana={showFurigana}
                hasFlashcard={hasFc}
                fullText={text}
                enContext={enContext}
              />
            );
          }

          if (!showFurigana) {
            return <span key={idx}>{seg.kanji}</span>;
          }
          return (
            <ruby
              key={idx}
              className="inline-flex flex-col items-center leading-none text-center mx-0.5 align-baseline"
            >
              <span className="text-[10px] font-normal select-none pb-0.5 leading-none text-muted-foreground">
                {toHiragana(seg.reading)}
              </span>
              <span className="leading-tight">{seg.kanji}</span>
            </ruby>
          );
        }

        const plainText = seg.text || "";
        const hasJapanese = /[\u3040-\u30ff\u4e00-\u9faf]/.test(plainText);

        if (!hasJapanese || !tokenizer) {
          return <span key={idx}>{plainText}</span>;
        }

        // Tokenize plain Japanese text using cached tokens to avoid repeated Viterbi lattice searches
        const tokens = getCachedTokens(tokenizer, plainText);
        return (
          <React.Fragment key={idx}>
            {tokens.map((token, tIdx) => {
              const isJp = /[\u3040-\u30ff\u4e00-\u9faf]/.test(token.surface_form);
              if (!isJp) {
                return <span key={tIdx}>{token.surface_form}</span>;
              }

              if (interactive) {
                const nextToken = tokens[tIdx + 1];
                const hasFc = flashcardWords
                  ? isWordInFlashcards(token.surface_form, token.basic_form, flashcardWords)
                  : false;
                return (
                  <TokenItem
                    key={tIdx}
                    word={token.surface_form}
                    reading={token.reading}
                    basicForm={token.basic_form}
                    nextWord={nextToken?.surface_form}
                    showFurigana={showFurigana}
                    hasFlashcard={hasFc}
                    fullText={text}
                    enContext={enContext}
                  />
                );
              }

              const tokenHasKanji = /[\u4e00-\u9faf]/.test(token.surface_form);
              const reading = token.reading ? toHiragana(token.reading) : "";

              if (showFurigana && tokenHasKanji && reading) {
                return (
                  <ruby
                    key={tIdx}
                    className="inline-flex flex-col items-center leading-none text-center mx-0.5 align-baseline"
                  >
                    <span className="text-[10px] font-normal select-none pb-0.5 leading-none text-muted-foreground">
                      {reading}
                    </span>
                    <span className="leading-tight">{token.surface_form}</span>
                  </ruby>
                );
              }
              return <span key={tIdx}>{token.surface_form}</span>;
            })}
          </React.Fragment>
        );
      })}
    </span>
  );
});
