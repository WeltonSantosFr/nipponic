import { db, connectDatabase } from "./db.ts";
import {
  N5_TRANSLATION_PROMPTS,
  N4_TRANSLATION_PROMPTS,
  N3_TRANSLATION_PROMPTS,
  N2_TRANSLATION_PROMPTS,
  N1_TRANSLATION_PROMPTS,
  type TranslationPrompt,
} from "@nipponic/shared";

const LEVEL_MAP: Record<string, readonly TranslationPrompt[]> = {
  N5: N5_TRANSLATION_PROMPTS,
  N4: N4_TRANSLATION_PROMPTS,
  N3: N3_TRANSLATION_PROMPTS,
  N2: N2_TRANSLATION_PROMPTS,
  N1: N1_TRANSLATION_PROMPTS,
};

export async function seedTranslationPrompts(
  targetLevel?: string
): Promise<{ inserted: number; level: string; totalInDb: number }> {
  await connectDatabase();

  const levelsToSeed = targetLevel && targetLevel !== "all"
    ? [targetLevel.toUpperCase()]
    : ["N5", "N4", "N3", "N2", "N1"];

  let count = 0;

  for (const level of levelsToSeed) {
    const prompts = LEVEL_MAP[level];
    if (!prompts) {
      throw new Error(`Unknown level: ${level}`);
    }

    console.log(`Seeding ${prompts.length} translation prompts for ${level}...`);

    for (const p of prompts) {
      const existing = await db.orm.public.TranslationPrompt.where({
        id: p.id,
      }).first();

      const payload = {
        order: p.order,
        day: p.day ?? p.order,
        difficulty: p.difficulty,
        difficultyLabel: p.difficultyLabel,
        jlptLevel: p.jlptLevel,
        direction: p.direction,
        sourceText: p.sourceText,
        sourceReading: p.sourceReading ?? null,
        canonicalAnswer: p.canonicalAnswer,
        answerReading: p.answerReading ?? null,
        acceptedAnswers: p.acceptedAnswers,
        hint: p.hint,
        explanation: p.explanation,
        grammarPoint: p.grammarPoint ?? null,
      };

      if (existing) {
        await db.orm.public.TranslationPrompt.where({ id: p.id }).update(payload);
      } else {
        await db.orm.public.TranslationPrompt.create({
          id: p.id,
          ...payload,
        });
      }
      count++;
    }
    console.log(`✓ Completed level ${level} (${prompts.length} prompts)`);
  }

  const allInDb = await db.orm.public.TranslationPrompt.all();
  console.log(`Total translation prompts now in DB: ${allInDb.length}`);

  return {
    inserted: count,
    level: targetLevel ?? "all",
    totalInDb: allInDb.length,
  };
}

if (process.argv[1]?.endsWith("seed-translation.ts")) {
  const arg = process.argv[2] ?? "all";
  seedTranslationPrompts(arg)
    .then((res) => {
      console.log(`Seeding finished:`, res);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Seeding error:", err);
      process.exit(1);
    });
}
