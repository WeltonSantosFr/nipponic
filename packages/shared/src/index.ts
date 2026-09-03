import { z } from "zod";

// Schema da Nota Completa
export const NoteSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  enText: z.string(),
  jpText: z.string(),
  updatedAt: z.string(),
});
export type Note = z.infer<typeof NoteSchema>;

// Schema de Regra de Glossário de Tradução
export const GlossaryRuleSchema = z.object({
  id: z.string(),
  sourceTerm: z.string().min(1, "Source term is required"),
  targetTerm: z.string().min(1, "Target term is required"),
});
export type GlossaryRule = z.infer<typeof GlossaryRuleSchema>;

// Contrato de Requisição de Tradução (Usado no Front e no Back)
export const TranslateRequestSchema = z.object({
  text: z.string().min(1, "The text to translate should not be empty"),
  sourceLang: z.enum(["PT", "EN"]).default("EN"),
  targetLang: z.enum(["JA"]).default("JA"),
  glossaryRules: z.array(GlossaryRuleSchema).optional(),
});
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

// Contrato de Resposta de Tradução
export const TranslateResponseSchema = z.object({
  translatedText: z.string(),
  detectedSourceLang: z.string().optional(),
});
export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;

// Schema do Flash Card
export const CardSchema = z.object({
  id: z.string(),
  jpText: z.string().min(1, "Japanese text is required"),
  enText: z.string().min(1, "English text is required"),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Card = z.infer<typeof CardSchema>;

// Schema do Deck (Pacote de Flash Cards)
export const DeckSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Deck name is required"),
  isPublic: z.boolean().default(false),
  cards: z.array(CardSchema).default([]),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Deck = z.infer<typeof DeckSchema>;

export const CreateCardSchema = z.object({
  jpText: z.string().min(1, "Japanese text is required"),
  enText: z.string().min(1, "English text is required"),
});
export type CreateCardInput = z.infer<typeof CreateCardSchema>;

export const UpdateCardSchema = CreateCardSchema.partial();
export type UpdateCardInput = z.infer<typeof UpdateCardSchema>;

export const CreateDeckSchema = z.object({
  name: z.string().min(1, "Deck name is required"),
  isPublic: z.boolean().optional().default(false),
  cardIds: z.array(z.string()).optional().default([]),
});
export type CreateDeckInput = z.infer<typeof CreateDeckSchema>;

export const UpdateDeckSchema = z.object({
  name: z.string().min(1, "Deck name is required").optional(),
  isPublic: z.boolean().optional(),
});
export type UpdateDeckInput = z.infer<typeof UpdateDeckSchema>;

export const ReorderDeckCardsSchema = z.object({
  cardIds: z.array(z.string()),
});
export type ReorderDeckCardsInput = z.infer<typeof ReorderDeckCardsSchema>;

export const AddCardsToDeckSchema = z.object({
  cardIds: z.array(z.string()),
});
export type AddCardsToDeckInput = z.infer<typeof AddCardsToDeckSchema>;

