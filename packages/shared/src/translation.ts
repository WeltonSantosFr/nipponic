import { z } from "zod";

// ==========================================
// Daily Translation Practice Contracts
// ==========================================

export const TranslationDirectionSchema = z.enum(["JP_TO_EN", "EN_TO_JP"]);
export type TranslationDirection = z.infer<typeof TranslationDirectionSchema>;

export const LocalDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "localDate must be YYYY-MM-DD");

export const TranslationPromptSchema = z.object({
  id: z.string(),
  order: z.number().int().min(1),
  day: z.number().int().min(1).optional(),
  difficulty: z.number().int().min(1).max(5),
  difficultyLabel: z.string(),
  jlptLevel: z.enum(["N5", "N4", "N3", "N2", "N1"]),
  direction: TranslationDirectionSchema,
  sourceText: z.string(),
  sourceReading: z.string().nullable().optional(),
  canonicalAnswer: z.string(),
  answerReading: z.string().nullable().optional(),
  acceptedAnswers: z.array(z.string()).min(1),
  hint: z.string(),
  explanation: z.string(),
  grammarPoint: z.string().nullable().optional(),
});
export type TranslationPrompt = z.infer<typeof TranslationPromptSchema>;

export const TranslationProgressSchema = z.object({
  currentDifficulty: z.number().int().min(1),
  completedPromptIds: z.array(z.string()),
  lastCompletedDate: z.string().nullable(),
  totalCompleted: z.number().int().min(0),
});
export type TranslationProgress = z.infer<typeof TranslationProgressSchema>;

export const TranslationDailyStateSchema = z.object({
  prompt: TranslationPromptSchema.nullable(),
  progress: TranslationProgressSchema,
  isLockedToday: z.boolean(),
  allCompleted: z.boolean(),
  totalPrompts: z.number().int().min(1),
  nextDifficultyLabel: z.string().nullable(),
});
export type TranslationDailyState = z.infer<typeof TranslationDailyStateSchema>;

export const SubmitTranslationSchema = z.object({
  promptId: z.string().min(1),
  answer: z.string().trim().min(1, "Please enter a translation"),
  localDate: LocalDateSchema.optional(),
});
export type SubmitTranslationInput = z.infer<typeof SubmitTranslationSchema>;
export type SubmitTranslationDto = SubmitTranslationInput;

export const SubmitTranslationResponseSchema = z.object({
  isCorrect: z.boolean(),
  alreadyLockedToday: z.boolean().optional(),
  canonicalAnswer: z.string(),
  answerReading: z.string().nullable().optional(),
  explanation: z.string(),
  state: TranslationDailyStateSchema,
});
export type SubmitTranslationResponse = z.infer<
  typeof SubmitTranslationResponseSchema
>;

export const DevUnlockTranslationSchema = z.object({
  resetAll: z.boolean().optional(),
});
export type DevUnlockTranslationInput = z.infer<typeof DevUnlockTranslationSchema>;

export interface TranslationEvaluationResult {
  isCorrect: boolean;
  normalizedInput: string;
  matchedAnswer?: string;
  canonicalAnswer: string;
  answerReading?: string | null;
  explanation: string;
}

/**
 * Four progressive MVP sentences: 2 JP->EN and 2 EN->JP, increasing difficulty on each success.
 */
export const MVP_TRANSLATION_PROMPTS: readonly TranslationPrompt[] = [
  {
    id: "mvp-1-jp-en",
    order: 1,
    difficulty: 1,
    difficultyLabel: "Level 1 · Beginner",
    jlptLevel: "N5",
    direction: "JP_TO_EN",
    sourceText: "お水をください。",
    sourceReading: "おみずをください。",
    canonicalAnswer: "Please give me some water.",
    acceptedAnswers: [
      "Please give me some water",
      "Please give me water",
      "Water, please",
      "Water please",
      "Some water, please",
      "Could I have some water",
      "Can I have some water",
      "I would like some water",
      "Please give me a glass of water",
    ],
    hint: "お水 (おみず) = water, 〜をください = please give me ~",
    explanation:
      "「お水をください」 is a polite everyday request meaning 'Please give me some water' or 'Water, please.'",
  },
  {
    id: "mvp-2-en-jp",
    order: 2,
    difficulty: 2,
    difficultyLabel: "Level 2 · Elementary",
    jlptLevel: "N5",
    direction: "EN_TO_JP",
    sourceText: "I drink coffee every morning.",
    canonicalAnswer: "毎朝コーヒーを飲みます。",
    answerReading: "まいあさコーヒーをのみます。",
    acceptedAnswers: [
      "毎朝コーヒーを飲みます",
      "まいあさコーヒーをのみます",
      "私は毎朝コーヒーを飲みます",
      "わたしは毎朝コーヒーを飲みます",
      "ぼくは毎朝コーヒーを飲みます",
      "毎朝珈琲を飲みます",
      "まいあさこーひーをのみます",
      "毎朝コーヒーを飲む",
      "まいあさコーヒーをのむ",
      "私は毎朝コーヒーを飲む",
    ],
    hint: "every morning = 毎朝 (まいあさ), coffee = コーヒー, drink = 飲みます (のみます)",
    explanation:
      "Time expressions such as 毎朝 (every morning) go near the beginning, followed by the direct object marked with を and the verb at the end: 毎朝コーヒーを飲みます。",
  },
  {
    id: "mvp-3-jp-en",
    order: 3,
    difficulty: 3,
    difficultyLabel: "Level 3 · Intermediate",
    jlptLevel: "N4",
    direction: "JP_TO_EN",
    sourceText: "雨が降っているので、家で映画を見ます。",
    sourceReading: "あめがふっているので、いえでえいがをみます。",
    canonicalAnswer: "Because it is raining, I will watch a movie at home.",
    acceptedAnswers: [
      "Because it is raining, I will watch a movie at home",
      "Because it's raining, I will watch a movie at home",
      "Because it is raining, I'll watch a movie at home",
      "Because it's raining, I'll watch a movie at home",
      "Because it is raining, I am going to watch a movie at home",
      "Because it's raining, I'm going to watch a movie at home",
      "Since it is raining, I will watch a movie at home",
      "Since it's raining, I will watch a movie at home",
      "Since it is raining, I'll watch a movie at home",
      "It is raining, so I will watch a movie at home",
      "It's raining, so I will watch a movie at home",
      "It's raining, so I'll watch a movie at home",
      "Because it is raining, I watch a movie at home",
    ],
    hint: "雨 (あめ) = rain, 降っている = is raining, 〜ので = because/since, 映画 (えいが) = movie",
    explanation:
      "「〜ので」 politely links a cause to its result: 雨が降っているので (because it is raining), 家で映画を見ます (I will watch a movie at home).",
  },
  {
    id: "mvp-4-en-jp",
    order: 4,
    difficulty: 4,
    difficultyLabel: "Level 4 · Upper Intermediate",
    jlptLevel: "N3",
    direction: "EN_TO_JP",
    sourceText: "If I have time tomorrow, I plan to go to the library.",
    canonicalAnswer: "明日時間があれば、図書館に行くつもりです。",
    answerReading: "あしたじかんがあれば、としょかんにいくつもりです。",
    acceptedAnswers: [
      "明日時間があれば、図書館に行くつもりです",
      "あしたじかんがあれば、としょかんにいくつもりです",
      "明日時間があれば図書館に行くつもりです",
      "明日時間があったら、図書館に行くつもりです",
      "あしたじかんがあったら、としょかんにいくつもりです",
      "明日時間があったら図書館に行くつもりです",
      "もし明日時間があれば、図書館に行くつもりです",
      "もし明日時間があったら、図書館に行くつもりです",
      "明日、時間があれば図書館に行くつもりです",
      "明日、時間があったら図書館に行くつもりです",
      "明日時間があれば、図書館へ行くつもりです",
      "明日時間があったら、図書館へ行くつもりです",
      "明日時間があれば、図書館に行く予定です",
      "明日時間があったら、図書館に行く予定です",
    ],
    hint: "if I have time = 時間があれば / 時間があったら, library = 図書館 (としょかん), plan to = 〜つもりです",
    explanation:
      "Combine the conditional 「〜ば」 or 「〜たら」 for 'if I have time' (時間があれば / 時間があったら) with 「[Dictionary verb] + つもりです」 to express an intention or plan.",
  },
] as const;

const EN_CONTRACTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bi'm\b/g, "i am"],
  [/\bi'll\b/g, "i will"],
  [/\bi'd\b/g, "i would"],
  [/\bi've\b/g, "i have"],
  [/\bit's\b/g, "it is"],
  [/\bthat's\b/g, "that is"],
  [/\bthere's\b/g, "there is"],
  [/\bwhat's\b/g, "what is"],
  [/\bdon't\b/g, "do not"],
  [/\bdoesn't\b/g, "does not"],
  [/\bdidn't\b/g, "did not"],
  [/\bwon't\b/g, "will not"],
  [/\bcan't\b/g, "cannot"],
  [/\bcannot\b/g, "cannot"],
  [/\bcan not\b/g, "cannot"],
  [/\bcouldn't\b/g, "could not"],
  [/\bwouldn't\b/g, "would not"],
  [/\bisn't\b/g, "is not"],
  [/\baren't\b/g, "are not"],
  [/\bwe're\b/g, "we are"],
  [/\bthey're\b/g, "they are"],
  [/\byou're\b/g, "you are"],
];

/**
 * Returns the caller's local calendar date formatted as YYYY-MM-DD.
 */
export function getTodayLocalDate(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes a user's translation string for deterministic comparison.
 */
export function normalizeTranslationText(
  input: string,
  direction: TranslationDirection
): string {
  if (!input) return "";

  if (direction === "JP_TO_EN") {
    let text = input
      .trim()
      .toLowerCase()
      .replace(/[’‘`]/g, "'")
      .replace(/[“”]/g, '"');

    for (const [pattern, replacement] of EN_CONTRACTIONS) {
      text = text.replace(pattern, replacement);
    }

    return text
      .replace(/[.,!?;:'"()\-—–/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // EN_TO_JP: strip whitespace (half & full width) and Japanese/English punctuation
  return input
    .trim()
    .replace(/[\s\u3000]+/g, "")
    .replace(/[。、．，.！!？?「」『』（）()・〜~ー—\-]/g, (ch) =>
      ch === "ー" ? "ー" : ""
    );
}

/**
 * Evaluates a user translation attempt against a prompt's accepted answers.
 */
export function evaluateTranslationAttempt(
  prompt: TranslationPrompt,
  userInput: string
): TranslationEvaluationResult {
  const normalizedInput = normalizeTranslationText(userInput, prompt.direction);
  if (!normalizedInput) {
    return {
      isCorrect: false,
      normalizedInput,
      canonicalAnswer: prompt.canonicalAnswer,
      answerReading: prompt.answerReading,
      explanation: prompt.explanation,
    };
  }

  const candidates = [prompt.canonicalAnswer, ...prompt.acceptedAnswers];
  for (const candidate of candidates) {
    if (
      normalizeTranslationText(candidate, prompt.direction) === normalizedInput
    ) {
      return {
        isCorrect: true,
        normalizedInput,
        matchedAnswer: candidate,
        canonicalAnswer: prompt.canonicalAnswer,
        answerReading: prompt.answerReading,
        explanation: prompt.explanation,
      };
    }
  }

  return {
    isCorrect: false,
    normalizedInput,
    canonicalAnswer: prompt.canonicalAnswer,
    answerReading: prompt.answerReading,
    explanation: prompt.explanation,
  };
}

/**
 * Computes the derived daily translation state from persisted progress and today's local date.
 */
export function buildTranslationDailyState(
  progress: TranslationProgress,
  todayLocalDate: string,
  prompts: readonly TranslationPrompt[] = MVP_TRANSLATION_PROMPTS
): TranslationDailyState {
  const completedSet = new Set(progress.completedPromptIds);
  const nextPrompt =
    prompts.find((p) => !completedSet.has(p.id)) ?? null;
  const allCompleted = nextPrompt === null;
  const isLockedToday =
    !allCompleted && progress.lastCompletedDate === todayLocalDate;

  const nextPromptAfterCurrent = nextPrompt
    ? prompts.find(
        (p) => p.order > nextPrompt.order && !completedSet.has(p.id)
      ) ?? null
    : null;

  return {
    prompt: nextPrompt,
    progress,
    isLockedToday,
    allCompleted,
    totalPrompts: prompts.length,
    nextDifficultyLabel: nextPromptAfterCurrent?.difficultyLabel ?? null,
  };
}
