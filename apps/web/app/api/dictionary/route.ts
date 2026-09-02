import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const word = searchParams.get("word");

  if (!word) {
    return NextResponse.json(
      { error: "Word not provided" },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(word)}`,
    );
    const data = await response.json();

    if (!data.data || data.data.length === 0) {
      return NextResponse.json(
        { error: "Word not found" },
        { status: 404 },
      );
    }

    const firstResult = data.data[0];
    const japanese = firstResult.japanese[0];

    const allMeanings = firstResult.senses.map((sense: any) =>
      sense.english_definitions.join(", "),
    );

    let jlpt = null;
    if (firstResult.jlpt && firstResult.jlpt.length > 0) {
      jlpt = firstResult.jlpt[0].replace("jlpt-", "").toUpperCase();
    }

    return NextResponse.json(
      {
        reading: japanese.reading || "",
        meanings: allMeanings,
        jlpt: jlpt,
        isCommon: firstResult.is_common || false,
      },
      {
        headers: {
          "Cache-Control":
            "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching from Jisho:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
