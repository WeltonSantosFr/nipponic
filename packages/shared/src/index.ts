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

// Contrato de Requisição de Tradução (Usado no Front e no Back)
export const TranslateRequestSchema = z.object({
  text: z.string().min(1, "The text to translate should not be empty"),
  sourceLang: z.enum(["PT", "EN"]).default("EN"),
  targetLang: z.enum(["JA"]).default("JA"),
});
export type TranslateRequest = z.infer<typeof TranslateRequestSchema>;

// Contrato de Resposta de Tradução
export const TranslateResponseSchema = z.object({
  translatedText: z.string(),
  detectedSourceLang: z.string().optional(),
});
export type TranslateResponse = z.infer<typeof TranslateResponseSchema>;
