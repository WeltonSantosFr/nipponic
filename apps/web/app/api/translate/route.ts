import { NextResponse } from "next/server";
import * as deepl from "deepl-node";
import { TranslateRequestSchema } from "@nipponic/shared";

const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY || "");

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsedData = TranslateRequestSchema.parse(body);

    const result = await translator.translateText(
      parsedData.text,
      parsedData.sourceLang === "EN" ? "en" : "pt",
      "ja",
    );

    return NextResponse.json({
      translatedText: result.text,
      detectedSourceLang: result.detectedSourceLang,
    });
  } catch (error) {
    console.error("Erro na tradução:", error);
    return NextResponse.json(
      { error: "Falha ao processar a tradução." },
      { status: 500 },
    );
  }
}
