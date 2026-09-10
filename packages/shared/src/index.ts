import { z } from "zod";

// ==========================================
// User & Auth Contracts
// ==========================================

export const JwtPayloadSchema = z.object({
  sub: z.string(),
  username: z.string(),
  email: z.string(),
});
export type JwtPayload = z.infer<typeof JwtPayloadSchema>;
export type UserPayload = JwtPayload;
export type JwtUserPayload = JwtPayload;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;
export type LoginDto = LoginInput;
export type LoginUserDto = LoginInput;
export type LoginProps = LoginInput;

export const AuthResponseSchema = z.object({
  access_token: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateUserDto = CreateUserInput;

export const UpdateUserSchema = z.object({
  username: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdateUserDto = UpdateUserInput;

// ==========================================
// Notes Contracts
// ==========================================

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  enText: z.string(),
  jpText: z.string(),
  sourceLang: z.enum(["EN", "JA"]).default("EN"),
  updatedAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

export const CreateNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  enText: z.string(),
  jpText: z.string(),
  sourceLang: z.enum(["EN", "JA"]).default("EN").optional(),
});
export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type CreateNoteDto = CreateNoteInput;

export const UpdateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  enText: z.string().optional(),
  jpText: z.string().optional(),
  sourceLang: z.enum(["EN", "JA"]).optional(),
});
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type UpdateNoteDto = UpdateNoteInput;

// ==========================================
// Translation & Glossary Contracts
// ==========================================

export const GlossaryRuleSchema = z.object({
  id: z.string(),
  sourceTerm: z.string().min(1, "Source term is required"),
  targetTerm: z.string().min(1, "Target term is required"),
});
export type GlossaryRule = z.infer<typeof GlossaryRuleSchema>;

export const TranslateRequestSchema = z.object({
  text: z.string().min(1, "The text to translate should not be empty"),
  sourceLang: z.enum(["PT", "EN", "JA"]).default("EN"),
  targetLang: z.enum(["JA", "EN", "PT"]).default("JA"),
  glossaryRules: z.array(GlossaryRuleSchema).optional(),
});
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

export const TranslateResponseSchema = z.object({
  translatedText: z.string(),
  detectedSourceLang: z.string().optional(),
});
export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;

// ==========================================
// Cards & SRS Contracts
// ==========================================

export const CardSchema = z.object({
  id: z.string(),
  jpText: z.string().min(1, "Japanese text is required"),
  enText: z.string().min(1, "English text is required"),
  interval: z.number().optional().default(0),
  easeFactor: z.number().optional().default(2.5),
  repetitions: z.number().optional().default(0),
  lapses: z.number().optional().default(0),
  nextReviewAt: z.union([z.string(), z.date()]).optional().nullable(),
  lastReviewedAt: z.union([z.string(), z.date()]).optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Card = z.infer<typeof CardSchema>;

// Rating de revisão do SM-2 (1: Again, 2: Hard, 3: Good, 4: Easy)
export type ReviewRating = 1 | 2 | 3 | 4;

export const ReviewCardSchema = z.object({
  rating: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});
export type ReviewCardInput = z.infer<typeof ReviewCardSchema>;
export type ReviewCardDto = ReviewCardInput;

export interface SRSResult {
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  lapses: number;
  nextReviewAt: string;
  lastReviewedAt: string;
}

/**
 * Calculates next review parameters based on the SuperMemo-2 (SM-2) algorithm.
 */
export function calculateNextReview(
  card: Pick<Card, "interval" | "easeFactor" | "repetitions" | "lapses">,
  rating: ReviewRating
): SRSResult {
  const currentEase = card.easeFactor ?? 2.5;
  const currentReps = card.repetitions ?? 0;
  const currentInterval = card.interval ?? 0;
  const currentLapses = card.lapses ?? 0;

  let newInterval = 1;
  let newEase = currentEase;
  let newReps = currentReps;
  let newLapses = currentLapses;
  let nextReviewDate: Date;

  const now = new Date();

  switch (rating) {
    case 1: // Again (Forgot)
      newReps = 0;
      newInterval = 0; // Due immediately / in 10 minutes
      newLapses = currentLapses + 1;
      newEase = Math.max(1.3, currentEase - 0.2);
      nextReviewDate = new Date(now.getTime() + 10 * 60 * 1000); // in 10 min
      break;

    case 2: // Hard (Difficult recall)
      newReps = currentReps + 1;
      newInterval = currentInterval <= 1 ? 1 : Math.max(1, Math.round(currentInterval * 1.2));
      newEase = Math.max(1.3, currentEase - 0.15);
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
      break;

    case 3: // Good (Standard correct recall)
      if (currentReps === 0) {
        newInterval = 1;
      } else if (currentReps === 1) {
        newInterval = 3;
      } else {
        newInterval = Math.max(1, Math.round((currentInterval || 1) * currentEase));
      }
      newReps = currentReps + 1;
      newEase = currentEase;
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
      break;

    case 4: // Easy (Instant effortless recall)
      if (currentReps === 0) {
        newInterval = 4;
      } else if (currentReps === 1) {
        newInterval = 7;
      } else {
        newInterval = Math.max(1, Math.round((currentInterval || 1) * currentEase * 1.3));
      }
      newReps = currentReps + 1;
      newEase = currentEase + 0.15;
      nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
      break;
  }

  return {
    interval: newInterval,
    easeFactor: Math.round(newEase * 100) / 100,
    repetitions: newReps,
    lapses: newLapses,
    nextReviewAt: nextReviewDate.toISOString(),
    lastReviewedAt: now.toISOString(),
  };
}

export type CardSRSStage = "new" | "learning" | "review" | "mastered";

export const CreateCardSchema = z.object({
  jpText: z.string().min(1, "Japanese text is required"),
  enText: z.string().min(1, "English text is required"),
  interval: z.number().optional(),
  easeFactor: z.number().optional(),
  repetitions: z.number().optional(),
  lapses: z.number().optional(),
  nextReviewAt: z.union([z.string(), z.date()]).optional().nullable(),
  lastReviewedAt: z.union([z.string(), z.date()]).optional().nullable(),
});
export type CreateCardInput = z.infer<typeof CreateCardSchema>;
export type CreateCardDto = CreateCardInput;

export const UpdateCardSchema = CreateCardSchema.partial();
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;
export type UpdateCardDto = UpdateCardInput;

// ==========================================
// Decks Contracts
// ==========================================

export const DeckSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Deck name is required"),
  isPublic: z.boolean().default(false),
  cards: z.array(CardSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Deck = z.infer<typeof DeckSchema>;

export const CreateDeckSchema = z.object({
  name: z.string().min(1, "Deck name is required"),
  isPublic: z.boolean().optional().default(false),
  cardIds: z.array(z.string()).optional().default([]),
});
export type CreateDeckInput = z.input<typeof CreateDeckSchema>;
export type CreateDeckDto = CreateDeckInput;
export type CreateDeckOutput = z.output<typeof CreateDeckSchema>;

export const UpdateDeckSchema = z.object({
  name: z.string().min(1, "Deck name is required").optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;
export type UpdateDeckDto = UpdateDeckInput;

export const ReorderDeckCardsSchema = z.object({
  cardIds: z.array(z.string()),
});
export type ReorderDeckCardsInput = z.infer<typeof ReorderDeckCardsSchema>;
export type ReorderCardsDto = ReorderDeckCardsInput;
export type ReorderDeckCardsDto = ReorderDeckCardsInput;

export const AddCardsToDeckSchema = z.object({
  cardIds: z.array(z.string()),
});
export type AddCardsToDeckInput = z.infer<typeof AddCardsToDeckSchema>;
export type AddCardsDto = AddCardsToDeckInput;
export type AddCardsToDeckDto = AddCardsToDeckInput;

// ==========================================
// Dictionary & Kanji Contracts
// ==========================================

export const DictionaryDataSchema = z.object({
  reading: z.string(),
  meanings: z.array(z.string()),
  jlpt: z.string().nullable(),
  isCommon: z.boolean(),
  isCustom: z.boolean().optional(),
});
export type DictionaryData = z.infer<typeof DictionaryDataSchema>;

export const CustomDefinitionInputSchema = z.object({
  reading: z.string(),
  meanings: z.array(z.string()),
  jlpt: z.string().nullable().optional(),
  isCommon: z.boolean().optional(),
});
export type CustomDefinitionInput = z.infer<typeof CustomDefinitionInputSchema>;
export type CustomDefinitionDto = CustomDefinitionInput;

export const KanjiInfoSchema = z.object({
  kanji: z.string(),
  grade: z.number().nullable(),
  strokeCount: z.number(),
  meanings: z.array(z.string()),
  kunReadings: z.array(z.string()),
  onReadings: z.array(z.string()),
  nameReadings: z.array(z.string()),
  jlpt: z.string().nullable(),
  unicode: z.string(),
  heisig: z.string().nullable(),
});
export type KanjiInfo = z.infer<typeof KanjiInfoSchema>;

export const MergedTokenSchema = z.object({
  surface_form: z.string(),
  reading: z.string().optional(),
  pos: z.string().optional(),
  isMerged: z.boolean().optional(),
});
export type MergedToken = z.infer<typeof MergedTokenSchema>;

// ==========================================
// Common API & Action Contracts
// ==========================================

export const ActionResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});
export type ActionResponse = z.infer<typeof ActionResponseSchema>;
export type ActionResult = ActionResponse;

export const ApiErrorResponseSchema = z.object({
  error: z.string(),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiError = ApiErrorResponse;

export const MessageResponseSchema = z.object({
  message: z.string(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export const TtsRequestSchema = z.object({
  text: z.string().min(1),
  lang: z.string().optional(),
});
export type TtsRequest = z.infer<typeof TtsRequestSchema>;

