import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");

  if (!word || !word.trim()) {
    return NextResponse.json(
      { error: "Word parameter is required" },
      { status: 400 },
    );
  }

  const cleanWord = word.trim();

  try {
    const response = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(cleanWord)}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Nipponic/1.0)",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Word not found" }, { status: 404 });
      }
      console.warn(`Jisho API responded with HTTP ${response.status} for word "${cleanWord}"`);
      return NextResponse.json(
        { error: `Upstream dictionary service responded with ${response.status}` },
        { status: response.status >= 500 ? 502 : response.status }
      );
    }

    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: "Word not found" },
        { status: 404 },
      );
    }

    // Try finding exact match or use first result
    const exactMatch = data.data.find((item: any) =>
      item.slug === cleanWord ||
      item.japanese?.some((j: any) => j.word === cleanWord || j.reading === cleanWord)
    );

    const targetItem = exactMatch || data.data[0];
    const japaneseObj =
      targetItem.japanese?.find((j: any) => j.reading === cleanWord || j.word === cleanWord) ||
      targetItem.japanese?.[0] ||
      {};

    const reading =
      japaneseObj.reading ||
      japaneseObj.word ||
      targetItem.slug ||
      cleanWord;

    const allMeanings: string[] =
      targetItem.senses
        ?.map((sense: any) => sense.english_definitions?.join(", "))
        .filter((m: string | undefined): m is string => Boolean(m && m.length > 0)) || [];

    let jlpt: string | null = null;
    if (
      targetItem.jlpt &&
      Array.isArray(targetItem.jlpt) &&
      targetItem.jlpt.length > 0
    ) {
      jlpt = targetItem.jlpt[0].replace("jlpt-", "").toUpperCase();
    }

    return NextResponse.json(
      {
        reading,
        meanings:
          allMeanings.length > 0
            ? allMeanings
            : ["No English definition found."],
        jlpt,
        isCommon: targetItem.is_common ?? false,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error(`Error fetching dictionary for "${cleanWord}":`, error);
    return NextResponse.json(
      { error: "Failed to fetch word definition from dictionary" },
      { status: 502 },
    );
  }
}
