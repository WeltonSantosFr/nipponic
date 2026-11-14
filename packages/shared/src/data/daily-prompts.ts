import type { TranslationPrompt } from "../translation";
import { N5_TRANSLATION_PROMPTS } from "./prompts-n5";
import { N4_TRANSLATION_PROMPTS } from "./prompts-n4";
import { N3_TRANSLATION_PROMPTS } from "./prompts-n3";
import { N2_TRANSLATION_PROMPTS } from "./prompts-n2";
import { N1_TRANSLATION_PROMPTS } from "./prompts-n1";

export { N5_TRANSLATION_PROMPTS } from "./prompts-n5";
export { N4_TRANSLATION_PROMPTS } from "./prompts-n4";
export { N3_TRANSLATION_PROMPTS } from "./prompts-n3";
export { N2_TRANSLATION_PROMPTS } from "./prompts-n2";
export { N1_TRANSLATION_PROMPTS } from "./prompts-n1";

/**
 * Complete 366-day bilingual translation practice corpus (N5 to N1).
 */
export const DAILY_TRANSLATION_PROMPTS: readonly TranslationPrompt[] = [
  ...N5_TRANSLATION_PROMPTS,
  ...N4_TRANSLATION_PROMPTS,
  ...N3_TRANSLATION_PROMPTS,
  ...N2_TRANSLATION_PROMPTS,
  ...N1_TRANSLATION_PROMPTS,
] as const;
