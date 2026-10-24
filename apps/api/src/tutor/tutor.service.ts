import {
  Inject,
  Injectable,
  NotFoundException,
  Logger,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { GeminiService, type TopicGenerationContext } from "./gemini.service";
import { ALL_SEED_CURRICULA } from "./curriculum.seed";
import type {
  CurriculumLevel,
  CurriculumTopic,
  Lesson,
  LessonExercise,
  DialogueLine,
  VocabularyItem,
  GenerateLessonPayload,
  GenerateUnitPayload,
} from "@nipponic/shared";

@Injectable()
export class TutorService implements OnModuleInit {
  private readonly logger = new Logger(TutorService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(GeminiService) private readonly geminiService: GeminiService
  ) {}

  async onModuleInit() {
    await this.ensureTablesExist();
    await this.seedCurriculumIfEmpty();
  }

  async ensureTablesExist() {
    try {
      await this.prisma.connect();
      const runtime = this.prisma.db.runtime() as unknown as {
        driver?: { execute: (req: { sql: string; params: unknown[] }) => Promise<unknown> };
      };
      const driver = runtime?.driver;
      if (!driver) return;
      const statements = [
        `CREATE TABLE IF NOT EXISTS "public"."curriculumTopic" (
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          "grammarKey" text NOT NULL,
          "id" text NOT NULL,
          "lessonIndex" int4 NOT NULL,
          "level" text NOT NULL,
          "objective" text NOT NULL,
          "title" text NOT NULL,
          "unitIndex" int4 NOT NULL,
          "unitTitle" text NOT NULL,
          "updatedAt" timestamptz DEFAULT (now()) NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE TABLE IF NOT EXISTS "public"."lesson" (
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          "dialogueJson" json NOT NULL,
          "id" text NOT NULL,
          "level" text DEFAULT 'N5' NOT NULL,
          "theoryMarkdown" text NOT NULL,
          "title" text NOT NULL,
          "topicId" text NOT NULL,
          "updatedAt" timestamptz DEFAULT (now()) NOT NULL,
          "vocabularyJson" json NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE TABLE IF NOT EXISTS "public"."lessonExercise" (
          "correctAnswer" text NOT NULL,
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          "explanation" text NOT NULL,
          "id" text NOT NULL,
          "lessonId" text NOT NULL,
          "optionsJson" json,
          "order" int4 NOT NULL,
          "prompt" text NOT NULL,
          "type" text NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE TABLE IF NOT EXISTS "public"."lessonFeedback" (
          "comment" text,
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          "id" text NOT NULL,
          "lessonId" text NOT NULL,
          "rating" text NOT NULL,
          "userId" text,
          PRIMARY KEY ("id")
        )`,
        `CREATE TABLE IF NOT EXISTS "public"."userLessonProgress" (
          "completedAt" timestamptz,
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          "id" text NOT NULL,
          "lessonId" text NOT NULL,
          "score" int4 DEFAULT 0 NOT NULL,
          "updatedAt" timestamptz DEFAULT (now()) NOT NULL,
          "userId" text NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "curriculumTopic_level_unitIndex_lessonIndex_key" ON "public"."curriculumTopic" ("level", "unitIndex", "lessonIndex")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "lesson_topicId_key" ON "public"."lesson" ("topicId")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "userLessonProgress_userId_lessonId_key" ON "public"."userLessonProgress" ("userId", "lessonId")`,
        `ALTER TABLE "public"."curriculumTopic" DISABLE ROW LEVEL SECURITY`,
        `ALTER TABLE "public"."lesson" DISABLE ROW LEVEL SECURITY`,
        `ALTER TABLE "public"."lessonExercise" DISABLE ROW LEVEL SECURITY`,
        `ALTER TABLE "public"."lessonFeedback" DISABLE ROW LEVEL SECURITY`,
        `ALTER TABLE "public"."userLessonProgress" DISABLE ROW LEVEL SECURITY`,
      ];

      for (const sql of statements) {
        await driver.execute({ sql, params: [] }).catch((err: unknown) => {
          this.logger.debug(
            `Table init notice: ${err instanceof Error ? err.message : String(err)}`
          );
        });
      }
      this.logger.log("Tutor database schema verification completed.");
    } catch (err) {
      this.logger.warn(
        `Could not auto-verify tutor tables: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  async seedCurriculumIfEmpty() {
    try {
      const levels: ("N5" | "N4" | "N3" | "N2" | "N1")[] = [
        "N5",
        "N4",
        "N3",
        "N2",
        "N1",
      ];
      for (const level of levels) {
        const existingTopic = await this.prisma.db.orm.public.CurriculumTopic
          .where({ level })
          .first()
          .catch(() => null);

        if (!existingTopic && ALL_SEED_CURRICULA[level]) {
          this.logger.log(`Seeding initial ${level} curriculum topics...`);
          for (const topic of ALL_SEED_CURRICULA[level]) {
            await this.prisma.db.orm.public.CurriculumTopic.create({
              level: topic.level,
              unitIndex: topic.unitIndex,
              unitTitle: topic.unitTitle,
              lessonIndex: topic.lessonIndex,
              title: topic.title,
              grammarKey: topic.grammarKey,
              objective: topic.objective,
            }).catch(() => {});
          }
          this.logger.log(
            `Seeded ${ALL_SEED_CURRICULA[level].length} ${level} curriculum topics.`
          );
        }
      }
    } catch (error) {
      this.logger.warn(
        `Could not seed curriculum topics: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getCurriculum(level: string = "N5", userId?: string): Promise<CurriculumTopic[]> {
    try {
      let topics = await this.prisma.db.orm.public.CurriculumTopic
        .where({ level })
        .all();

      // Auto-seed level if empty and default curriculum is available
      if (
        topics.length === 0 &&
        ALL_SEED_CURRICULA[level as keyof typeof ALL_SEED_CURRICULA]
      ) {
        const seedList = ALL_SEED_CURRICULA[level as keyof typeof ALL_SEED_CURRICULA];
        for (const topic of seedList) {
          await this.prisma.db.orm.public.CurriculumTopic.create({
            level: topic.level,
            unitIndex: topic.unitIndex,
            unitTitle: topic.unitTitle,
            lessonIndex: topic.lessonIndex,
            title: topic.title,
            grammarKey: topic.grammarKey,
            objective: topic.objective,
          }).catch(() => {});
        }
        topics = await this.prisma.db.orm.public.CurriculumTopic
          .where({ level })
          .all();
      }

      topics.sort((a, b) =>
        a.unitIndex === b.unitIndex
          ? a.lessonIndex - b.lessonIndex
          : a.unitIndex - b.unitIndex
      );

      let lessons: Array<{ id: string; topicId: string }> = [];
      try {
        lessons = await this.prisma.db.orm.public.Lesson
          .where({ level })
          .all();
      } catch {
        lessons = [];
      }

      const lessonByTopicId = new Map(lessons.map((l) => [l.topicId, l]));

      let userProgressMap = new Map<string, { completedAt: Date | null; score: number }>();
      if (userId) {
        try {
          const progresses = await this.prisma.db.orm.public.UserLessonProgress
            .where({ userId })
            .all();
          userProgressMap = new Map(
            progresses.map((p) => [p.lessonId, { completedAt: p.completedAt, score: p.score }])
          );
        } catch {
          userProgressMap = new Map();
        }
      }

      return topics.map((t) => {
        const existingLesson = lessonByTopicId.get(t.id);
        const userProgress = existingLesson ? userProgressMap.get(existingLesson.id) : undefined;

        return {
          id: t.id,
          level: t.level as "N5" | "N4" | "N3" | "N2" | "N1",
          unitIndex: t.unitIndex,
          unitTitle: t.unitTitle,
          lessonIndex: t.lessonIndex,
          title: t.title,
          grammarKey: t.grammarKey,
          objective: t.objective,
          hasLesson: Boolean(existingLesson),
          isCompleted: Boolean(userProgress?.completedAt),
          completedScore: userProgress?.score,
        };
      });
    } catch (error) {
      this.logger.error(
        `Error querying curriculum for level ${level}, falling back to seed list: ${error instanceof Error ? error.message : String(error)}`
      );
      const seedList = ALL_SEED_CURRICULA[level as keyof typeof ALL_SEED_CURRICULA] || ALL_SEED_CURRICULA.N5;
      return seedList.map((t) => ({
        id: `seed-${t.level}-${t.unitIndex}-${t.lessonIndex}`,
        level: t.level,
        unitIndex: t.unitIndex,
        unitTitle: t.unitTitle,
        lessonIndex: t.lessonIndex,
        title: t.title,
        grammarKey: t.grammarKey,
        objective: t.objective,
        hasLesson: false,
        isCompleted: false,
      }));
    }
  }

  async getLessonByTopicId(topicId: string, userId?: string): Promise<Lesson> {
    let topic = await this.prisma.db.orm.public.CurriculumTopic
      .where({ id: topicId })
      .first()
      .catch(() => null);

    if (!topic && topicId.startsWith("seed-")) {
      const parts = topicId.split("-");
      const level = parts[1];
      const lessonIndex = parseInt(parts[3], 10);
      const seedList = ALL_SEED_CURRICULA[level as keyof typeof ALL_SEED_CURRICULA] || [];
      const match = seedList.find((s) => s.lessonIndex === lessonIndex);
      if (match) {
        try {
          topic = await this.prisma.db.orm.public.CurriculumTopic.create({
            level: match.level,
            unitIndex: match.unitIndex,
            unitTitle: match.unitTitle,
            lessonIndex: match.lessonIndex,
            title: match.title,
            grammarKey: match.grammarKey,
            objective: match.objective,
          });
          topicId = topic.id;
        } catch {
          topic = {
            id: topicId,
            level: match.level,
            unitIndex: match.unitIndex,
            unitTitle: match.unitTitle,
            lessonIndex: match.lessonIndex,
            title: match.title,
            grammarKey: match.grammarKey,
            objective: match.objective,
          } as any;
        }
      }
    }

    if (!topic) {
      throw new NotFoundException(`Curriculum topic "${topicId}" not found`);
    }

    let lesson = await this.prisma.db.orm.public.Lesson
      .where({ topicId })
      .first();

    const hasRomajiSlugLeak = Boolean(
      lesson &&
      (
        (lesson.theoryMarkdown && (
          /[a-zA-Z]{3,}-[a-zA-Z]{3,}/.test(lesson.theoryMarkdown) ||
          lesson.theoryMarkdown.includes("kiwamarinai-extreme")
        )) ||
        (Array.isArray(lesson.vocabularyJson) &&
          (lesson.vocabularyJson as any[]).some(
            (v) =>
              /^[a-zA-Z0-9\-_ ]+$/.test(v.jpText) ||
              /[a-zA-Z]{3,}-[a-zA-Z]{3,}/.test(v.jpText) ||
              /[a-zA-Z]{3,}-[a-zA-Z]{3,}/.test(v.reading)
          ))
      )
    );

    const isStaleBogusFallback = Boolean(
      lesson &&
      (
        hasRomajiSlugLeak ||
        (
          topic.grammarKey !== "desu" &&
          (lesson.theoryMarkdown?.includes("[Noun / Phrase] + です") ||
           lesson.theoryMarkdown?.includes("[Noun] + です") ||
           lesson.title === "Polite Copula です")
        )
      )
    );

    let isRejectedByFeedback = false;
    let feedbackComments: string[] = [];
    let regenerationReason = "";

    if (lesson && !isStaleBogusFallback) {
      const feedbacks = await this.prisma.db.orm.public.LessonFeedback
        .where({ lessonId: lesson.id })
        .all();

      const totalFeedbacks = feedbacks.length;
      const confusingFeedbacks = feedbacks.filter((f) => f.rating === "confusing");
      const confusingRatio = totalFeedbacks > 0 ? confusingFeedbacks.length / totalFeedbacks : 0;

      // Threshold: >= 3 total reviews and >= 60% negative ("confusing") feedback
      if (totalFeedbacks >= 3 && confusingRatio >= 0.6) {
        isRejectedByFeedback = true;
        regenerationReason = `Community feedback threshold reached: ${Math.round(confusingRatio * 100)}% confusing ratings (${confusingFeedbacks.length}/${totalFeedbacks} reviews).`;
        feedbackComments = confusingFeedbacks
          .map((f) => f.comment)
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0);
      }
    }

    if (!lesson || isStaleBogusFallback || isRejectedByFeedback) {
      if ((isStaleBogusFallback || isRejectedByFeedback) && lesson) {
        this.logger.log(
          isRejectedByFeedback
            ? `Regenerating lesson for topic "${topic.title}" (${topic.id}) due to negative feedback: ${regenerationReason}`
            : `Replacing stale bogus fallback lesson for topic "${topic.title}" (${topic.id}) with fresh Gemini generation...`
        );
        const oldExercises = await this.prisma.db.orm.public.LessonExercise
          .where({ lessonId: lesson.id })
          .all();
        for (const ex of oldExercises) {
          await this.prisma.db.orm.public.LessonExercise.where({ id: ex.id }).delete();
        }
        const oldFeedbacks = await this.prisma.db.orm.public.LessonFeedback
          .where({ lessonId: lesson.id })
          .all();
        for (const fb of oldFeedbacks) {
          await this.prisma.db.orm.public.LessonFeedback.where({ id: fb.id }).delete();
        }
        const oldProgress = await this.prisma.db.orm.public.UserLessonProgress
          .where({ lessonId: lesson.id })
          .all();
        for (const p of oldProgress) {
          await this.prisma.db.orm.public.UserLessonProgress.where({ id: p.id }).delete();
        }
        await this.prisma.db.orm.public.Lesson.where({ id: lesson.id }).delete();
        lesson = null;
      }

      this.logger.log(
        isRejectedByFeedback
          ? `Triggering improved lesson re-generation with Gemini for "${topic.title}" (${topic.id})...`
          : `Lesson for topic "${topic.title}" (${topic.id}) not found in DB. Triggering JIT generation with Gemini...`
      );

      let generated: GenerateLessonPayload;
      try {
        const generationContext: TopicGenerationContext = {
          title: topic.title,
          level: topic.level,
          grammarKey: topic.grammarKey,
          objective: topic.objective,
          ...(isRejectedByFeedback
            ? {
                isRegeneration: true,
                regenerationReason,
                previousFeedbackComments: feedbackComments.length
                  ? feedbackComments
                  : undefined,
              }
            : {}),
        };
        generated = await this.geminiService.generateLesson(generationContext);
      } catch (genError) {
        this.logger.error(
          `Gemini lesson generation failed for "${topic.title}", using deterministic fallback: ${genError}`
        );
        generated = this.geminiService.generateFallbackLesson({
          title: topic.title,
          level: topic.level,
          grammarKey: topic.grammarKey,
          objective: topic.objective,
        });
      }

      lesson = await this.prisma.db.orm.public.Lesson.create({
        topicId: topic.id,
        title: generated.title || topic.title,
        level: topic.level,
        theoryMarkdown: generated.theoryMarkdown,
        dialogueJson: generated.dialogue,
        vocabularyJson: generated.vocabulary,
      });

      // Create exercises
      for (const ex of generated.exercises) {
        await this.prisma.db.orm.public.LessonExercise.create({
          lessonId: lesson.id,
          order: ex.order,
          type: ex.type,
          prompt: ex.prompt,
          optionsJson: ex.options ?? null,
          correctAnswer: ex.correctAnswer,
          explanation: ex.explanation,
        });
      }

      this.logger.log(
        `Successfully generated and cached lesson "${lesson.id}" with ${generated.exercises.length} exercises.`
      );
    }

    // Retrieve exercises
    const dbExercises = await this.prisma.db.orm.public.LessonExercise
      .where({ lessonId: lesson.id })
      .all();

    dbExercises.sort((a, b) => a.order - b.order);

    let isCompleted = false;
    let score: number | undefined;

    if (userId) {
      const progress = await this.prisma.db.orm.public.UserLessonProgress
        .where({ userId, lessonId: lesson.id })
        .first();

      if (progress) {
        isCompleted = Boolean(progress.completedAt);
        score = progress.score;
      }
    }

    const dialogue = (
      Array.isArray(lesson.dialogueJson)
        ? lesson.dialogueJson
        : typeof lesson.dialogueJson === "string"
        ? JSON.parse(lesson.dialogueJson)
        : []
    ) as DialogueLine[];

    const vocabulary = (
      Array.isArray(lesson.vocabularyJson)
        ? lesson.vocabularyJson
        : typeof lesson.vocabularyJson === "string"
        ? JSON.parse(lesson.vocabularyJson)
        : []
    ) as VocabularyItem[];

    const exercises: LessonExercise[] = dbExercises.map((e) => {
      let options: string[] | undefined;
      if (e.optionsJson) {
        options = Array.isArray(e.optionsJson)
          ? (e.optionsJson as string[])
          : typeof e.optionsJson === "string"
          ? JSON.parse(e.optionsJson)
          : undefined;
      }

      return {
        id: e.id,
        order: e.order,
        type: e.type as "multiple_choice" | "fill_blank" | "reorder",
        prompt: e.prompt,
        options,
        correctAnswer: e.correctAnswer,
        explanation: e.explanation,
      };
    });

    return {
      id: lesson.id,
      topicId: topic.id,
      title: lesson.title,
      level: lesson.level as "N5" | "N4" | "N3" | "N2" | "N1",
      theoryMarkdown: lesson.theoryMarkdown,
      dialogue,
      vocabulary,
      exercises,
      isCompleted,
      score,
      createdAt: lesson.createdAt,
    };
  }

  async recordProgress(
    userId: string,
    lessonId: string,
    score: number
  ): Promise<{ success: boolean; score: number }> {
    const existingLesson = await this.prisma.db.orm.public.Lesson
      .where({ id: lessonId })
      .first();

    if (!existingLesson) {
      throw new NotFoundException(`Lesson "${lessonId}" not found`);
    }

    const existingProgress = await this.prisma.db.orm.public.UserLessonProgress
      .where({ userId, lessonId })
      .first();

    if (existingProgress) {
      await this.prisma.db.orm.public.UserLessonProgress
        .where({ id: existingProgress.id })
        .update({
          score: Math.max(existingProgress.score, score),
          completedAt: new Date(),
        });
    } else {
      await this.prisma.db.orm.public.UserLessonProgress.create({
        userId,
        lessonId,
        score,
        completedAt: new Date(),
      });
    }

    return { success: true, score };
  }

  async submitFeedback(
    lessonId: string,
    rating: string,
    comment?: string,
    userId?: string
  ): Promise<{ success: boolean }> {
    const existingLesson = await this.prisma.db.orm.public.Lesson
      .where({ id: lessonId })
      .first();

    if (!existingLesson) {
      throw new NotFoundException(`Lesson "${lessonId}" not found`);
    }

    await this.prisma.db.orm.public.LessonFeedback.create({
      lessonId,
      rating,
      comment: comment ?? null,
      userId: userId ?? null,
    });

    return { success: true };
  }

  async generateNextUnitForLevel(
    level: string = "N5",
    userId?: string
  ): Promise<CurriculumTopic[]> {
    const existingTopics = await this.prisma.db.orm.public.CurriculumTopic
      .where({ level })
      .all();

    const maxUnit = existingTopics.length
      ? Math.max(...existingTopics.map((t) => t.unitIndex))
      : 0;
    const nextUnitIndex = maxUnit + 1;

    const maxLesson = existingTopics.length
      ? Math.max(...existingTopics.map((t) => t.lessonIndex))
      : 0;
    const startingLessonIndex = maxLesson + 1;

    let generatedUnit: GenerateUnitPayload;
    try {
      generatedUnit = await this.geminiService.generateCurriculumUnit(
        level,
        nextUnitIndex,
        startingLessonIndex
      );
    } catch (genError) {
      this.logger.error(
        `Gemini unit generation failed for JLPT ${level}, using deterministic fallback: ${genError}`
      );
      generatedUnit = this.geminiService.generateFallbackUnit(
        level,
        nextUnitIndex,
        startingLessonIndex
      );
    }

    for (const topic of generatedUnit.topics) {
      await this.prisma.db.orm.public.CurriculumTopic.create({
        level: level as "N5" | "N4" | "N3" | "N2" | "N1",
        unitIndex: nextUnitIndex,
        unitTitle: generatedUnit.unitTitle,
        lessonIndex: topic.lessonIndex,
        title: topic.title,
        grammarKey: topic.grammarKey,
        objective: topic.objective,
      });
    }

    this.logger.log(
      `Successfully generated and saved ${generatedUnit.topics.length} topics for JLPT ${level} Unit ${nextUnitIndex}.`
    );

    return await this.getCurriculum(level, userId);
  }
}

