"use client";

import { useEffect, useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Layers, Volume2 } from "lucide-react";
import { useSpeech } from "@/hooks/use-speech";

import type { KanjiInfo } from "@nipponic/shared";

export type { KanjiInfo };

interface KanjiBreakdownProps {
  word: string;
}

export function KanjiBreakdown({ word }: KanjiBreakdownProps) {
  const kanjiList: string[] = useMemo(() => word.match(/[\u4e00-\u9faf]/g) || [], [word]);
  const [selectedKanji, setSelectedKanji] = useState<string>(
    kanjiList[0] || ""
  );
  const [kanjiData, setKanjiData] = useState<Record<string, KanjiInfo>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);
  const { speak } = useSpeech();

  useEffect(() => {
    if (kanjiList.length > 0 && !kanjiList.includes(selectedKanji)) {
      setSelectedKanji(kanjiList[0] || "");
    }
  }, [kanjiList, selectedKanji]);

  useEffect(() => {
    if (!selectedKanji) return;
    if (kanjiData[selectedKanji]) return;

    let isMounted = true;
    setLoading(true);
    setError(false);

    fetch(`/api/kanji?char=${encodeURIComponent(selectedKanji)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data: KanjiInfo) => {
        if (isMounted) {
          setKanjiData((prev) => ({ ...prev, [selectedKanji]: data }));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Failed to load kanji data:", err);
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedKanji, kanjiData]);

  if (kanjiList.length === 0) {
    return (
      <div className="p-3 text-center text-xs text-muted-foreground">
        This word contains Kana only (no Kanji components).
      </div>
    );
  }

  const current = kanjiData[selectedKanji];

  return (
    <div className="flex flex-col gap-3 text-xs">
      {/* Kanji character selector if word has multiple kanji */}
      {kanjiList.length > 1 && (
        <div className="flex items-center gap-1.5 border-b pb-2">
          <span className="text-[11px] text-muted-foreground mr-1">Kanji:</span>
          {kanjiList.map((char, idx) => (
            <button
              key={`${idx}-${char}`}
              type="button"
              onClick={() => setSelectedKanji(char)}
              className={`w-7 h-7 rounded-md font-japanese font-bold text-sm transition-all cursor-pointer ${
                selectedKanji === char
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted hover:bg-muted/80 text-foreground"
              }`}
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading Kanji breakdown...</span>
        </div>
      ) : error || !current ? (
        <div className="flex flex-col items-center justify-center py-4 text-center text-muted-foreground gap-1">
          <p className="font-semibold text-foreground text-sm font-japanese">
            {selectedKanji}
          </p>
          <span className="text-[11px]">Detailed Kanji info not found</span>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 animate-in fade-in duration-150">
          {/* Main Kanji Banner */}
          <div className="flex items-start justify-between gap-3 bg-muted/40 p-2.5 rounded-lg border border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-background border flex items-center justify-center font-japanese text-3xl font-extrabold text-foreground shadow-xs">
                {current.kanji}
              </div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {current.jlpt && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-bold">
                      {current.jlpt}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                    {current.strokeCount} strokes
                  </Badge>
                  {current.grade && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-muted-foreground">
                      Grade {current.grade}
                    </Badge>
                  )}
                </div>
                {current.heisig && (
                  <span className="text-[11px] font-semibold text-primary">
                    Keyword: {current.heisig}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meanings */}
          {current.meanings.length > 0 && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                Meanings
              </span>
              <p className="text-foreground font-medium text-xs leading-snug">
                {current.meanings.join(", ")}
              </p>
            </div>
          )}

          {/* Kun-yomi & On-yomi Readings */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40">
            {/* Kun-yomi (Japanese native reading) */}
            <div className="flex flex-col gap-1 bg-muted/20 p-2 rounded-md border border-border/40">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>Kun-yomi (訓)</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {current.kunReadings.length > 0 ? (
                  current.kunReadings.map((r, i) => (
                    <span
                      key={i}
                      onClick={() => speak(r.replace(/[.-]/g, ""), "ja-JP")}
                      className="font-japanese font-medium text-xs text-foreground bg-background px-1.5 py-0.5 rounded cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-0.5"
                      title="Click to hear reading"
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground/60 italic">—</span>
                )}
              </div>
            </div>

            {/* On-yomi (Sino-Japanese reading) */}
            <div className="flex flex-col gap-1 bg-muted/20 p-2 rounded-md border border-border/40">
              <span className="text-[10px] font-semibold text-muted-foreground flex items-center justify-between">
                <span>On-yomi (音)</span>
              </span>
              <div className="flex flex-wrap gap-1">
                {current.onReadings.length > 0 ? (
                  current.onReadings.map((r, i) => (
                    <span
                      key={i}
                      onClick={() => speak(r.replace(/[.-]/g, ""), "ja-JP")}
                      className="font-japanese font-medium text-xs text-foreground bg-background px-1.5 py-0.5 rounded cursor-pointer hover:text-primary transition-colors inline-flex items-center gap-0.5"
                      title="Click to hear reading"
                    >
                      {r}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] text-muted-foreground/60 italic">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
