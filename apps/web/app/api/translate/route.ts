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

    const result = await translator.translateText(
      parsedData.text,
      parsedData.sourceLang === "EN" ? "en" : "pt",
      "ja",
    );

    let translatedText = result.text;

    // Apply custom glossary rules if provided
    if (parsedData.glossaryRules && parsedData.glossaryRules.length > 0) {
      for (const rule of parsedData.glossaryRules) {
        const sourceTerm = rule.sourceTerm.trim();
        const targetTerm = rule.targetTerm.trim();
        if (!sourceTerm || !targetTerm) continue;

        const enRegex = new RegExp(`\\b${escapeRegExp(sourceTerm)}\\b`, "i");
        if (enRegex.test(parsedData.text)) {
          try {
            // Find default translation of the specific source term to replace it in context
            const singleTermResult = await translator.translateText(
              sourceTerm,
              "en",
              "ja"
            );
            const defaultJpTerm = singleTermResult.text.trim();
            if (
              defaultJpTerm &&
              translatedText.includes(defaultJpTerm) &&
              defaultJpTerm !== targetTerm
            ) {
              translatedText = translatedText.replaceAll(
                defaultJpTerm,
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

