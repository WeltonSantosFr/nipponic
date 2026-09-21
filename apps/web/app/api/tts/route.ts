import { NextResponse } from "next/server";
import type { ApiErrorResponse } from "@nipponic/shared";

function cleanTextForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[#>\s*+-]+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function chunkText(text: string, maxLen = 140): string[] {
  const clean = cleanTextForSpeech(text);
  if (!clean) return [];

  // Split by sentence terminators: Japanese 。！？ or English .!? or newline
  const sentenceRegex = /[^。！？!?\n]+[。！？!?\n]*/g;
  const rawSentences = clean.match(sentenceRegex) || [clean];

  const chunks: string[] = [];
  let current = "";

  for (const sentence of rawSentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;

    if ((current + (current ? " " : "") + trimmed).length <= maxLen) {
      current = current ? `${current} ${trimmed}` : trimmed;
    } else {
      if (current) {
        chunks.push(current);
        current = "";
      }

      if (trimmed.length <= maxLen) {
        current = trimmed;
      } else {
        // If a single sentence exceeds maxLen, split by commas or clause marks
        const clauseRegex = /[^、,;:，]+[、,;:，]*/g;
        const clauses = trimmed.match(clauseRegex) || [trimmed];
        let subCurrent = "";

        for (const clause of clauses) {
          const clauseTrimmed = clause.trim();
          if (!clauseTrimmed) continue;

          if ((subCurrent + (subCurrent ? " " : "") + clauseTrimmed).length <= maxLen) {
            subCurrent = subCurrent ? `${subCurrent} ${clauseTrimmed}` : clauseTrimmed;
          } else {
            if (subCurrent) {
              chunks.push(subCurrent);
              subCurrent = "";
            }

            if (clauseTrimmed.length <= maxLen) {
              subCurrent = clauseTrimmed;
            } else {
              // Hard fallback: split by maxLen characters
              for (let i = 0; i < clauseTrimmed.length; i += maxLen) {
                chunks.push(clauseTrimmed.slice(i, i + maxLen));
              }
            }
          }
        }

        if (subCurrent) {
          current = subCurrent;
        }
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

async function fetchTtsChunk(chunk: string, targetLang: string): Promise<Buffer> {
  const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${targetLang}&q=${encodeURIComponent(
    chunk
  )}`;

  const response = await fetch(googleTtsUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`TTS provider responded with status ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function handleTts(text: string | null | undefined, lang: string) {
  if (!text || !text.trim()) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Text parameter is required" },
      { status: 400 }
    );
  }

  const targetLang = lang.toLowerCase().startsWith("ja") ? "ja" : "en";
  const chunks = chunkText(text, 140);

  if (chunks.length === 0) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "No playable text provided" },
      { status: 400 }
    );
  }

  try {
    // Process in batches of 4 to prevent Google rate limits
    const BATCH_SIZE = 4;
    const buffers: Buffer[] = [];

    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchBuffers = await Promise.all(
        batch.map((chunk) => fetchTtsChunk(chunk, targetLang))
      );
      buffers.push(...batchBuffers);
    }

    const combinedBuffer = Buffer.concat(buffers);

    return new Response(combinedBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error generating TTS audio:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Failed to generate TTS audio" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get("text");
  const lang = searchParams.get("lang") || "en";
  return handleTts(text, lang);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const text = body?.text;
    const lang = body?.lang || "en";
    return handleTts(text, lang);
  } catch {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Invalid request payload" },
      { status: 400 }
    );
  }
}
