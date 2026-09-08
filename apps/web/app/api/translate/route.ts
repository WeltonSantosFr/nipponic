import { NextResponse } from "next/server";
import * as deepl from "deepl-node";
import { TranslateRequestSchema } from "@nipponic/shared";

const translator = new deepl.Translator(process.env.DEEPL_AUTH_KEY || "");

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const parsedData = TranslateRequestSchema.parse(body);

    const sourceLangCode =
      parsedData.sourceLang === "JA"
        ? ("ja" as const)
        : parsedData.sourceLang === "PT"
        ? ("pt" as const)
        : ("en" as const);

    const targetLangCode =
      parsedData.targetLang === "EN"
        ? ("en-US" as const)
        : parsedData.targetLang === "PT"
        ? ("pt-BR" as const)
        : ("ja" as const);

    const result = await translator.translateText(
      parsedData.text,
      sourceLangCode,
      targetLangCode
    );

    let translatedText = result.text;

    // Apply custom glossary rules if provided
    if (parsedData.glossaryRules && parsedData.glossaryRules.length > 0) {
      for (const rule of parsedData.glossaryRules) {
        const sourceTerm = rule.sourceTerm.trim();
        const targetTerm = rule.targetTerm.trim();
        if (!sourceTerm || !targetTerm) continue;

        // Check forward match (sourceTerm in input text)
        const isMatched =
          sourceLangCode === "ja"
            ? parsedData.text.includes(sourceTerm)
            : new RegExp(`\\b${escapeRegExp(sourceTerm)}\\b`, "i").test(
                parsedData.text
              );

        if (isMatched) {
          try {
            const singleTermResult = await translator.translateText(
              sourceTerm,
              sourceLangCode,
              targetLangCode
            );
            const defaultTargetTerm = singleTermResult.text.trim();
            if (
              defaultTargetTerm &&
              translatedText.includes(defaultTargetTerm) &&
              defaultTargetTerm !== targetTerm
            ) {
              translatedText = translatedText.replaceAll(
                defaultTargetTerm,
                targetTerm
              );
            }
          } catch {
            // Ignore single term lookup failure
          }
        }
      }
    }

    return NextResponse.json({
      translatedText,
      detectedSourceLang: result.detectedSourceLang,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Failed to process translation." },
      { status: 500 },
    );
  }
}

