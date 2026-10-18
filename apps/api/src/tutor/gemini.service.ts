import { Injectable, Logger } from "@nestjs/common";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import {
  type GenerateLessonPayload,
  GenerateLessonPayloadSchema,
  type GenerateUnitPayload,
  GenerateUnitPayloadSchema,
} from "@nipponic/shared";

interface TopicGenerationContext {
  title: string;
  level: string;
  grammarKey: string;
  objective: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private getApiKey(): string | undefined {
    let raw = process.env.GEMINI_API_KEY;
    if (!raw) {
      const candidates = [
        path.resolve(process.cwd(), "apps/api/.env"),
        path.resolve(process.cwd(), ".env"),
        "/app/apps/api/.env",
      ];
      for (const c of candidates) {
        try {
          if (fs.existsSync(c)) {
            const parsed = dotenv.parse(fs.readFileSync(c));
            if (parsed.GEMINI_API_KEY) {
              raw = parsed.GEMINI_API_KEY;
              break;
            }
          }
        } catch {}
      }
    }
    if (!raw) return undefined;
    return raw.replace(/^["']|["']$/g, "").trim();
  }

  async generateLesson(
    context: TopicGenerationContext
  ): Promise<GenerateLessonPayload> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.logger.warn(
        `GEMINI_API_KEY not configured. Generating high-quality deterministic fallback lesson for "${context.title}".`
      );
      return this.generateFallbackLesson(context);
    }

    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    for (const model of models) {
      try {
        const prompt = `
You are an expert Japanese language tutor creating a structured daily micro-lesson for JLPT level ${context.level}.
Topic: ${context.title}
Grammar Key: ${context.grammarKey}
Objective: ${context.objective}

Return ONLY valid JSON adhering strictly to this schema:
{
  "title": string (Lesson title in English),
  "theoryMarkdown": string (Concise, engaging explanation of the grammar rule with formulas like "[Noun] + です", examples with romaji/furigana, and cultural or usage tips),
  "dialogue": [
    { "speaker": string, "jpText": string, "enText": string }
  ] (4 to 6 natural conversation lines between two speakers applying this grammar point),
  "vocabulary": [
    { "jpText": string, "reading": string, "enText": string }
  ] (4 to 6 key vocabulary words from the lesson),
  "exercises": [
    {
      "order": number (1, 2, 3...),
      "type": "multiple_choice" | "fill_blank" | "reorder",
      "prompt": string (The exercise question/instruction in English),
      "options": string[] (Array of choices if multiple_choice or word chunks if reorder, omitted for fill_blank),
      "correctAnswer": string,
      "explanation": string (Clear explanation of why this answer is correct)
    }
  ] (3 to 4 exercises testing the grammar)
}

All instructions, theory, and question prompts MUST be in English.
Japanese text should use appropriate Kanji with kana readings provided in vocabulary.
`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.3,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.warn(
            `Gemini API request failed for model ${model} (${response.status}): ${errorText}`
          );
          if (response.status === 400 || response.status === 401 || response.status === 403) {
            // Invalid API key or permission error, don't keep failing on other models
            break;
          }
          continue;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          continue;
        }

        const parsedJson = JSON.parse(rawText);
        return GenerateLessonPayloadSchema.parse(parsedJson);
      } catch (error) {
        this.logger.warn(
          `Error generating lesson with Gemini model ${model}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    this.logger.log(`Using high-quality deterministic fallback lesson for "${context.title}".`);
    return this.generateFallbackLesson(context);
  }

  generateFallbackLesson(
    context: TopicGenerationContext
  ): GenerateLessonPayload {
    return {
      title: context.title,
      theoryMarkdown: `### ${context.title}\n\n${context.objective}\n\n#### Key Formula\n\`[Noun / Phrase] + です\`\n\n#### Usage Notes\nIn polite Japanese (*Teineigo*), this pattern is used in everyday conversation to create natural and polite statements. Remember to match particle usage carefully.`,
      dialogue: [
        {
          speaker: "田中 (Tanaka)",
          jpText: "はじめまして、田中です。よろしくお願いします。",
          enText: "Nice to meet you, I am Tanaka. Please treat me well.",
        },
        {
          speaker: "スミス (Smith)",
          jpText: "はじめまして、スミスです。こちらこそよろしくお願いします。",
          enText: "Nice to meet you, I am Smith. Likewise, please treat me well.",
        },
        {
          speaker: "田中 (Tanaka)",
          jpText: "スミスさんは学生ですか。",
          enText: "Smith-san, are you a student?",
        },
        {
          speaker: "スミス (Smith)",
          jpText: "はい、学生です。",
          enText: "Yes, I am a student.",
        },
      ],
      vocabulary: [
        {
          jpText: "はじめまして",
          reading: "はじめまして",
          enText: "Nice to meet you",
        },
        {
          jpText: "学生",
          reading: "がくせい",
          enText: "Student",
        },
        {
          jpText: "はい",
          reading: "はい",
          enText: "Yes",
        },
        {
          jpText: "よろしく",
          reading: "よろしく",
          enText: "Best regards / Please treat me well",
        },
      ],
      exercises: [
        {
          order: 1,
          type: "multiple_choice",
          prompt: "Select the polite copula used to say 'I am Tanaka':",
          options: ["です", "ます", "でした", "ません"],
          correctAnswer: "です",
          explanation: "です (desu) is the polite copula equivalent to 'to be' in English.",
        },
        {
          order: 2,
          type: "fill_blank",
          prompt: "Complete the sentence: 'はい、学生____' (Yes, I am a student).",
          correctAnswer: "です",
          explanation: "です completes the sentence politely.",
        },
        {
          order: 3,
          type: "reorder",
          prompt: "Arrange the words to form: 'Nice to meet you, I am Smith.'",
          options: ["はじめまして、", "スミス", "です。"],
          correctAnswer: "はじめまして、 スミス です。",
          explanation: "Natural polite introduction order.",
        },
      ],
    };
  }

  async generateCurriculumUnit(
    level: string,
    unitIndex: number,
    startingLessonIndex: number
  ): Promise<GenerateUnitPayload> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      this.logger.warn(
        `GEMINI_API_KEY not configured. Generating high-quality deterministic fallback unit for JLPT ${level} Unit ${unitIndex}.`
      );
      return this.generateFallbackUnit(level, unitIndex, startingLessonIndex);
    }

    const models = ["gemini-2.5-flash", "gemini-1.5-flash"];

    for (const model of models) {
      try {
        const prompt = `
You are an expert Japanese curriculum designer creating a structured study unit for JLPT level ${level}.
Unit Index: ${unitIndex}
Starting Lesson Index: ${startingLessonIndex}

Generate a cohesive unit containing 4 to 5 daily micro-lessons focusing on essential grammar patterns, particle usage, and practical everyday communication appropriate for JLPT ${level}.

Return ONLY valid JSON adhering strictly to this schema:
{
  "unitTitle": string (Engaging Unit title in English, e.g. "Practical Everyday Routines"),
  "topics": [
    {
      "lessonIndex": number (starting at ${startingLessonIndex}, ${startingLessonIndex + 1}, etc.),
      "title": string (Lesson title in English, e.g. "Desire with 〜たい (Want to do)"),
      "grammarKey": string (e.g. "tai-form-desire"),
      "objective": string (1-2 sentences in English explaining what the student will learn and apply)
    }
  ]
}

All unitTitle, title, and objective fields MUST be in English.
`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.4,
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.warn(
            `Gemini API request failed for curriculum unit with model ${model} (${response.status}): ${errorText}`
          );
          if (response.status === 400 || response.status === 401 || response.status === 403) {
            // Invalid API key or permission error, don't keep failing on other models
            break;
          }
          continue;
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
          continue;
        }

        const parsedJson = JSON.parse(rawText);
        return GenerateUnitPayloadSchema.parse(parsedJson);
      } catch (error) {
        this.logger.warn(
          `Error generating curriculum unit with Gemini model ${model}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    return this.generateFallbackUnit(level, unitIndex, startingLessonIndex);
  }


  generateFallbackUnit(
    level: string,
    unitIndex: number,
    startingLessonIndex: number
  ): GenerateUnitPayload {
    const titlesByLevel: Record<string, string> = {
      N5: `Everyday Conversation & Actions (Unit ${unitIndex})`,
      N4: `Intermediate Connections & Reasoning (Unit ${unitIndex})`,
      N3: `Conversational Nuances & Situational Grammar (Unit ${unitIndex})`,
      N2: `Formal Communication & Advanced Logic (Unit ${unitIndex})`,
      N1: `Nuanced Discourse & Literary Constructs (Unit ${unitIndex})`,
    };

    const unitTitle =
      titlesByLevel[level] || `JLPT ${level} Advanced Study (Unit ${unitIndex})`;

    return {
      unitTitle,
      topics: [
        {
          lessonIndex: startingLessonIndex,
          title: `Expressing Intentions & Plans (${level})`,
          grammarKey: `intention-${level.toLowerCase()}-${startingLessonIndex}`,
          objective: `Master standard patterns used to communicate personal intentions and future plans in JLPT ${level}.`,
        },
        {
          lessonIndex: startingLessonIndex + 1,
          title: `Giving & Explaining Reasons (${level})`,
          grammarKey: `reasons-${level.toLowerCase()}-${startingLessonIndex + 1}`,
          objective: `Express causes, justifications, and logical connectors naturally in everyday dialogue.`,
        },
        {
          lessonIndex: startingLessonIndex + 2,
          title: `Conditional Circumstances & Context (${level})`,
          grammarKey: `conditionals-${level.toLowerCase()}-${startingLessonIndex + 2}`,
          objective: `Formulate situational statements and conditional clauses appropriate for level ${level}.`,
        },
        {
          lessonIndex: startingLessonIndex + 3,
          title: `Practical Nuances & Colloquial Expressions (${level})`,
          grammarKey: `nuances-${level.toLowerCase()}-${startingLessonIndex + 3}`,
          objective: `Understand the subtle emotional undertones and social context in authentic Japanese interactions.`,
        },
      ],
    };
  }
}

