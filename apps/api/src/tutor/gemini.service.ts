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

export interface TopicGenerationContext {
  title: string;
  level: string;
  grammarKey: string;
  objective: string;
  isRegeneration?: boolean;
  regenerationReason?: string;
  previousFeedbackComments?: string[];
}

export const JLPT_LEVEL_CALIBRATION: Record<string, string> = {
  N5: `JLPT N5 PEDAGOGICAL SPECIFICATIONS (ABSOLUTE BEGINNER):
- Vocabulary & Grammar Scope: Fundamental polite Japanese (です/ます form). Basic particles (は, が, を, に, で, へ, と, も, から, まで). Simple [Noun] は [Noun] です and basic verbs.
- Kanji & Furigana: Use ONLY introductory elementary kanji (~100 kanji like 日, 月, 人, 本). You MUST provide ruby Furigana for 100% of all kanji used.
- Sentence Structure: Very short, simple clause sentences. Never use complex subordinate clauses or advanced idioms.
- Tone & Explanations: Extremely clear, friendly, welcoming English. Zero intimidating linguistic jargon. Focus on foundational everyday basics.`,

  N4: `JLPT N4 PEDAGOGICAL SPECIFICATIONS (ELEMENTARY / UPPER BEGINNER):
- Vocabulary & Grammar Scope: Plain forms (辞書形, ない形, た形), basic compound sentences, foundational conditionals (〜たら, 〜なら, 〜ば), basic potential (〜られる), volitional (〜よう), basic giving/receiving (〜てあげる/もらう/くれる).
- Kanji & Furigana: Elementary kanji (~300 kanji). You MUST provide ruby Furigana for all kanji.
- Tone & Explanations: Clearly contrast polite (丁寧語) and casual (普通形) registers. Break down conjugation mechanics step-by-step.`,

  N3: `JLPT N3 PEDAGOGICAL SPECIFICATIONS (INTERMEDIATE - BRIDGE LEVEL):
- Vocabulary & Grammar Scope: Natural conversational Japanese, intermediate conjunctions, and nuanced distinctions between similar grammar forms (e.g. わけだ vs はずだ, ようにする vs ことにする, compound auxiliary verbs).
- Kanji & Furigana: Intermediate kanji (~650 kanji). Provide ruby Furigana on compound kanji words (熟語).
- Tone & Explanations: Emphasize pragmatic context, speaker intentionality, social situations (in-group vs out-group, situational appropriateness), and common student confusion points.`,

  N2: `JLPT N2 PEDAGOGICAL SPECIFICATIONS (UPPER INTERMEDIATE / BUSINESS & ACADEMIC):
- Vocabulary & Grammar Scope: Formal, business, written, news, and academic expressions (e.g. にあたって, に際して, を契機に, にともなって, ざるを得ない).
- Kanji & Furigana: Advanced kanji (~1000 kanji). Provide ruby Furigana for non-standard readings, formal compounds, and literary kanji.
- Tone & Explanations: Clarify rigid formal constraints, written versus spoken registers, and precise semantic differences between similar high-level markers.`,

  N1: `JLPT N1 PEDAGOGICAL SPECIFICATIONS (ADVANCED / NEAR-NATIVE PROFICIENCY):
- Vocabulary & Grammar Scope: Highly sophisticated, literary, classical, rhetorical, and idiomatic Japanese (e.g. 極まりない, ごとき, であれ, ずくめ, たるもの, んばかり).
- Kanji & Furigana: Advanced, rare, and literary kanji compounds. You MUST provide ruby Furigana so advanced learners can read the kanji immediately without needing external audio or dictionary lookups.
- Tone & Explanations: Deep exploration of subtle emotional nuance (deep indignation, extreme inevitability, profound solemnity, archaic dignity) and contextual collocations in realistic high-register settings (editorial, executive business, or classical/formal speech).`,
};

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);

  private getApiKey(): string | undefined {
    let raw = process.env.GEMINI_API_KEY;
    if (!raw) {
      const candidates = [
        path.resolve(process.cwd(), "apps/api/.env"),
        path.resolve(process.cwd(), "apps/api/src/.env"),
        path.resolve(process.cwd(), "src/.env"),
        path.resolve(process.cwd(), ".env"),
        "/app/apps/api/.env",
        "/app/apps/api/src/.env",
        "/app/.env",
      ];
      try {
        if (typeof __dirname !== "undefined") {
          candidates.push(
            path.resolve(__dirname, "../.env"),
            path.resolve(__dirname, "../../.env"),
            path.resolve(__dirname, ".env")
          );
        }
      } catch {}

      for (const c of candidates) {
        try {
          if (fs.existsSync(c)) {
            const content = fs.readFileSync(c, "utf-8");
            const parsed = dotenv.parse(content);
            if (parsed.GEMINI_API_KEY) {
              raw = parsed.GEMINI_API_KEY;
              break;
            }
            const match = content.match(/^\s*GEMINI_API_KEY\s*=\s*["']?([^"'\r\n]+)["']?/m);
            if (match?.[1]) {
              raw = match[1].trim();
              break;
            }
          }
        } catch {}
      }
    }
    if (!raw) return undefined;
    return raw.replace(/^["']|["']$/g, "").trim();
  }

  buildLessonPrompt(context: TopicGenerationContext): string {
    const levelKey = (context.level || "N5").toUpperCase();
    const levelCalibration = JLPT_LEVEL_CALIBRATION[levelKey] || JLPT_LEVEL_CALIBRATION.N5;

    let refinementDirective = "";
    if (context.isRegeneration) {
      const commentsSnippet = context.previousFeedbackComments?.length
        ? `\nLEARNER COMPLAINTS & SPECIFIC FEEDBACK TO RESOLVE:\n${context.previousFeedbackComments
            .map((c, i) => `  ${i + 1}. "${c}"`)
            .join("\n")}`
        : "";

      refinementDirective = `
REFINEMENT DIRECTIVE (CRITICAL - PEDAGOGICAL UPGRADE):
The previous version of this lesson was marked as "confusing / needs improvement" by learners.
Trigger Reason: ${context.regenerationReason || "Learners struggled to follow the explanation or apply the grammar pattern."}${commentsSnippet}

You MUST significantly upgrade this regenerated version with the following enhancements:
1. STEP-BY-STEP FORMULA & CONJUGATION BREAKDOWN:
   - Provide an explicit structural breakdown (e.g. "Verb [Dictionary form] + Pattern", "Na-adjective [Stem + な] + Pattern").
   - Explicitly highlight conjugation traps where students commonly make mistakes.
2. CONTRASTIVE ANALYSIS & NUANCE ("When to use vs When NOT to use"):
   - Add a dedicated section explaining: How is this expression different from similar or simpler patterns? Why choose this over other options?
3. SITUATIONALLY ENRICHED DIALOGUE:
   - Provide clear situational framing in the dialogue demonstrating WHY this grammar point was chosen in context (e.g. formal business negotiation, deep emotional confession, friendly debate).
4. TARGETED REINFORCING EXERCISES:
   - Include at least one exercise that directly tests the nuance or conjugation trap highlighted in the theory.
   - Explanations for correct answers must clearly explain not only why the correct answer is right, but why the distractor options are incorrect or unnatural.
`;
    }

    return `
You are an expert Japanese language tutor creating a structured daily micro-lesson calibrated specifically for JLPT level ${context.level}.
Topic: ${context.title}
Grammar Slug: ${context.grammarKey}
Objective: ${context.objective}

${levelCalibration}
${refinementDirective}
CRITICAL LINGUISTIC & FORMATTING RULES:
1. NEVER output Romaji or English slug identifiers (such as "${context.grammarKey}", "kiwamarinai-extreme", or hyphenated text) in any Japanese field ("jpText", "reading", "dialogue", options, or exercise answers).
2. The grammar slug "${context.grammarKey}" is an internal code identifier. You MUST identify the real Japanese grammar pattern (e.g. from the topic "${context.title}") and write it using authentic Japanese Kanji and Kana.
3. In "vocabulary":
   - "jpText" MUST be written in genuine Japanese characters (Kanji and Kana, e.g. "極まりない").
   - "reading" MUST be the pure Hiragana reading (or Katakana for loanwords, e.g. "きわまりない").
   - "enText" is the clear English meaning.
4. In "dialogue":
   - Every "jpText" MUST be authentic Japanese with appropriate Kanji and Kana.
   - Dialogue must be 4 to 6 lines demonstrating the grammar in natural conversation between 2 speakers.
5. In "exercises":
   - Exercise question prompts and instructions MUST be in English.
   - Multiple choice choices/options in Japanese MUST be written in Japanese Kanji/Kana.
   - For fill-in-the-blank ("fill_blank") and questions where the learner enters/identifies the grammar, "correctAnswer" MUST be written in real Japanese (Kanji or Kana, e.g. "極まりない"), NEVER Romaji or hyphenated English.
   - In "reorder", the choices must be natural Japanese word/phrase chunks.
6. In "theoryMarkdown":
   - Explain the grammar rule clearly in English with structural formulas (e.g. "[Na-adj stem] + 極まりない", "[Noun] + を皮切りに").
   - For all Japanese example sentences in the theory, provide Furigana readings using markdown ruby format "{漢字|かんじ}" or "<ruby>漢字<rt>かんじ</rt></ruby>" so learners can easily read advanced kanji.
   - Include nuances, register (formal, literary, spoken), and typical pitfalls.

Return ONLY valid JSON adhering strictly to this schema:
{
  "title": string (Lesson title in English),
  "theoryMarkdown": string (Concise, engaging explanation of the grammar rule with formulas and examples with furigana),
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

All instructions, theory explanation, and question prompts MUST be in English.
All Japanese content MUST use authentic Kanji and Kana. NEVER USE ROMAJI.
`;
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
        const prompt = this.buildLessonPrompt(context);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: context.isRegeneration ? 0.35 : 0.3,
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
    // Extract authentic Japanese grammar pattern from title (e.g. "〜極まりない / 〜極まる" -> "極まりない")
    let cleanJpPattern = "";
    const matchParen = context.title.match(/[（(]([^）)]+)[）)]/);
    if (matchParen) {
      cleanJpPattern = matchParen[1].replace(/^[〜~]/, "").split(/[/／]/)[0].trim();
    }
    if (!cleanJpPattern || /^[a-zA-Z0-9\-_ ]+$/.test(cleanJpPattern)) {
      const matchJp = context.title.match(/[\u4e00-\u9faf\u3040-\u309f\u30a0-\u30ff]+/);
      cleanJpPattern = matchJp ? matchJp[0] : "";
    }
    const key = cleanJpPattern || "文法表現";

    return {
      title: context.title,
      theoryMarkdown: `### ${context.title}\n\n${context.objective}\n\n#### Key Formula\n\`[Phrase / Stem] + ${key}\`\n\n#### Example\nこの文脈では、{${key}|きわまりない}を使うのが最も自然です。\n\n#### Usage Notes\nIn JLPT ${context.level}, this pattern is used to convey: *${context.objective}*. Notice the formal register compared to conversational expressions.`,
      dialogue: [
        {
          speaker: "田中 (Tanaka)",
          jpText: `この文脈では、${key}を使うのが最も自然です。`,
          enText: `In this context, using ${key} is the most natural.`,
        },
        {
          speaker: "スミス (Smith)",
          jpText: `なるほど、${key}を使うことでニュアンスが明確になりますね。`,
          enText: `I see, so using ${key} makes the nuance clear.`,
        },
        {
          speaker: "田中 (Tanaka)",
          jpText: `はい、その通りです。実際の会話や文章でもよく見られます。`,
          enText: `Yes, exactly. It is frequently seen in authentic conversations and texts.`,
        },
        {
          speaker: "スミス (Smith)",
          jpText: `よく分かりました。しっかり復習しておきます。`,
          enText: `I understand well. I will review it thoroughly.`,
        },
      ],
      vocabulary: [
        {
          jpText: key,
          reading: key,
          enText: context.title,
        },
        {
          jpText: "文脈",
          reading: "ぶんみゃく",
          enText: "Context",
        },
        {
          jpText: "自然",
          reading: "しぜん",
          enText: "Natural",
        },
        {
          jpText: "復習",
          reading: "ふくしゅう",
          enText: "Review / revision",
        },
      ],
      exercises: [
        {
          order: 1,
          type: "multiple_choice",
          prompt: `Select the pattern that correctly expresses: "${context.objective}"`,
          options: [key, "かもしれない", "わけではない", "ことになっている"],
          correctAnswer: key,
          explanation: `${key} correctly expresses ${context.objective}.`,
        },
        {
          order: 2,
          type: "fill_blank",
          prompt: `Fill in the blank with the target grammar: "この文脈では、____を使うのが最も自然です。"`,
          correctAnswer: key,
          explanation: `${key} correctly completes the contextual sentence.`,
        },
        {
          order: 3,
          type: "reorder",
          prompt: `Arrange the words in order: "In this context, using ${key} is most natural."`,
          options: ["この文脈では、", key, "を使うのが", "最も自然です。"],
          correctAnswer: `この文脈では、 ${key} を使うのが 最も自然です。`,
          explanation: "Standard natural Japanese word order.",
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

