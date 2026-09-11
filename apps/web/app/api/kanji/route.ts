import { NextResponse } from "next/server";
import type { KanjiInfo, ApiErrorResponse } from "@nipponic/shared";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const char = searchParams.get("char");

  if (!char || !char.trim()) {
    return NextResponse.json<ApiErrorResponse>(
      { error: "Kanji character parameter is required" },
      { status: 400 }
    );
  }

  const cleanChar = char.trim().charAt(0);

  try {
    const res = await fetch(
      `https://kanjiapi.dev/v1/kanji/${encodeURIComponent(cleanChar)}`,
      {
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json<ApiErrorResponse>(
          { error: "Kanji not found" },
          { status: 404 }
        );
      }
      throw new Error(`Kanji API responded with ${res.status}`);
    }

    const data = await res.json();

    return NextResponse.json<KanjiInfo>(
      {
        kanji: data.kanji,
        grade: data.grade,
        strokeCount: data.stroke_count,
        meanings: data.meanings || [],
        kunReadings: data.kun_readings || [],
        onReadings: data.on_readings || [],
        nameReadings: data.name_readings || [],
        jlpt: data.jlpt ? `N${data.jlpt}` : null,
        unicode: data.unicode,
        heisig: data.heisig_en || null,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=604800, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching kanji data:", error);
    return NextResponse.json<ApiErrorResponse>(
      { error: "Internal server error fetching kanji details" },
      { status: 500 }
    );
  }
}
