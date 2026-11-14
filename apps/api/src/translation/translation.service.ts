import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  type OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  MVP_TRANSLATION_PROMPTS,
  evaluateTranslationAttempt,
  getTodayLocalDate,
  buildTranslationDailyState,
  LocalDateSchema,
  SubmitTranslationSchema,
  DevUnlockTranslationSchema,
  type TranslationPrompt,
  type TranslationDailyState,
  type SubmitTranslationDto,
  type SubmitTranslationResponse,
  type DevUnlockTranslationInput,
  type TranslationProgress,
} from "@nipponic/shared";

@Injectable()
export class TranslationService implements OnModuleInit {
  private readonly logger = new Logger(TranslationService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    await this.ensureTablesExist();
  }

  async ensureTablesExist(): Promise<void> {
    try {
      if (typeof this.prisma.connect === "function") {
        await this.prisma.connect();
      }
      interface SqlDriver {
        execute?: (req: { sql: string; params: unknown[] }) => Promise<unknown>;
      }
      interface PrismaDbRuntimeShape {
        runtime?: () => { driver?: SqlDriver };
        $driver?: SqlDriver;
      }
      const dbWithRuntime = this.prisma.db as unknown as PrismaDbRuntimeShape;
      const runtime = dbWithRuntime?.runtime?.();
      const driver = runtime?.driver ?? dbWithRuntime?.$driver;
      if (!driver?.execute) return;

      const statements = [
        `CREATE TABLE IF NOT EXISTS "public"."userTranslationProgress" (
          "id" text NOT NULL,
          "userId" text NOT NULL,
          "currentDifficulty" int4 DEFAULT 1 NOT NULL,
          "completedPromptIds" json NOT NULL,
          "lastCompletedDate" text,
          "totalCompleted" int4 DEFAULT 0 NOT NULL,
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          "updatedAt" timestamptz DEFAULT (now()) NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "userTranslationProgress_userId_key" ON "public"."userTranslationProgress" ("userId")`,
        `ALTER TABLE "public"."userTranslationProgress" DISABLE ROW LEVEL SECURITY`,
        `CREATE TABLE IF NOT EXISTS "public"."translationAttempt" (
          "id" text NOT NULL,
          "userId" text NOT NULL,
          "promptId" text NOT NULL,
          "userAnswer" text NOT NULL,
          "isCorrect" bool NOT NULL,
          "localDate" text NOT NULL,
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE INDEX IF NOT EXISTS "translationAttempt_userId_idx" ON "public"."translationAttempt" ("userId")`,
        `CREATE INDEX IF NOT EXISTS "translationAttempt_userId_localDate_idx" ON "public"."translationAttempt" ("userId", "localDate")`,
        `ALTER TABLE "public"."translationAttempt" DISABLE ROW LEVEL SECURITY`,
        `CREATE TABLE IF NOT EXISTS "public"."translationPrompt" (
          "id" text NOT NULL,
          "order" int4 NOT NULL,
          "day" int4 NOT NULL,
          "difficulty" int4 NOT NULL,
          "difficultyLabel" text NOT NULL,
          "jlptLevel" text NOT NULL,
          "direction" text NOT NULL,
          "sourceText" text NOT NULL,
          "sourceReading" text,
          "canonicalAnswer" text NOT NULL,
          "answerReading" text,
          "acceptedAnswers" json NOT NULL,
          "hint" text NOT NULL,
          "explanation" text NOT NULL,
          "grammarPoint" text,
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          "updatedAt" timestamptz DEFAULT (now()) NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "translationPrompt_order_key" ON "public"."translationPrompt" ("order")`,
        `CREATE UNIQUE INDEX IF NOT EXISTS "translationPrompt_day_key" ON "public"."translationPrompt" ("day")`,
        `ALTER TABLE "public"."translationPrompt" DISABLE ROW LEVEL SECURITY`,
      ];

      for (const sql of statements) {
        await driver.execute({ sql, params: [] }).catch((err: unknown) => {
          this.logger.debug(
            `Translation schema check notice: ${err instanceof Error ? err.message : String(err)}`
          );
        });
      }
      this.logger.log("Translation database schema verified.");
    } catch (err) {
      this.logger.warn(`Could not verify Translation tables: ${err}`);
    }
  }

  async getPrompts(): Promise<readonly TranslationPrompt[]> {
    try {
      type PublicOrm = {
        TranslationPrompt?: {
          all?: () => Promise<TranslationPrompt[]>;
        };
      };
      const orm = this.prisma.db?.orm?.public as unknown as PublicOrm | undefined;
      const dbPrompts = await orm?.TranslationPrompt?.all?.();
      if (dbPrompts && dbPrompts.length > 0) {
        return [...dbPrompts].sort((a, b) => a.order - b.order);
      }
    } catch (err) {
      this.logger.debug(
        `Could not load prompts from DB, falling back: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    return MVP_TRANSLATION_PROMPTS;
  }

  private async loadProgress(userId: string) {
    const existing =
      await this.prisma.db.orm.public.UserTranslationProgress.first({ userId });
    const rawCompleted = existing?.completedPromptIds;
    const completedPromptIds: string[] = Array.isArray(rawCompleted)
      ? rawCompleted.filter((id): id is string => typeof id === "string")
      : [];

    return {
      existing,
      progress: {
        currentDifficulty: existing?.currentDifficulty ?? 1,
        completedPromptIds,
        lastCompletedDate: existing?.lastCompletedDate ?? null,
        totalCompleted: existing?.totalCompleted ?? completedPromptIds.length,
      },
    };
  }

  async getDailyState(
    userId?: string,
    localDate?: string,
  ): Promise<TranslationDailyState> {
    let today = getTodayLocalDate();
    if (localDate !== undefined) {
      const parsedDate = LocalDateSchema.safeParse(localDate);
      if (!parsedDate.success) {
        throw new BadRequestException("Invalid localDate format. Expected YYYY-MM-DD");
      }
      today = parsedDate.data;
    }

    const prompts = await this.getPrompts();

    if (!userId) {
      return buildTranslationDailyState(
        {
          currentDifficulty: 1,
          completedPromptIds: [],
          lastCompletedDate: null,
          totalCompleted: 0,
        },
        today,
        prompts,
      );
    }

    const { progress } = await this.loadProgress(userId);
    return buildTranslationDailyState(progress, today, prompts);
  }

  async submitAttempt(
    userId: string,
    body: SubmitTranslationDto,
  ): Promise<SubmitTranslationResponse> {
    const parsed = SubmitTranslationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(
        parsed.error.issues[0]?.message ?? "Invalid submission data",
      );
    }

    const today = parsed.data.localDate ?? getTodayLocalDate();

    const { existing, progress } = await this.loadProgress(userId);
    const completedPromptIds = progress.completedPromptIds;

    const prompts = await this.getPrompts();
    const state = buildTranslationDailyState(progress, today, prompts);

    if (state.allCompleted || !state.prompt) {
      throw new BadRequestException(
        "All translation challenges have already been completed",
      );
    }

    if (state.isLockedToday) {
      return {
        isCorrect: false,
        alreadyLockedToday: true,
        canonicalAnswer: state.prompt.canonicalAnswer,
        answerReading: state.prompt.answerReading,
        explanation:
          "Daily challenge already completed for today. Come back tomorrow!",
        state,
      };
    }

    if (parsed.data.promptId !== state.prompt.id) {
      throw new BadRequestException(
        "Submitted prompt does not match the current challenge",
      );
    }

    const result = evaluateTranslationAttempt(state.prompt, parsed.data.answer);

    await this.prisma.db.orm.public.TranslationAttempt.create({
      userId,
      promptId: state.prompt.id,
      userAnswer: parsed.data.answer.trim(),
      isCorrect: result.isCorrect,
      localDate: today,
    });

    if (result.isCorrect) {
      const updatedPromptIds = Array.from(
        new Set([...completedPromptIds, state.prompt.id]),
      );
      const totalCompleted = updatedPromptIds.length;
      const currentDifficulty = Math.min(
        prompts.length,
        updatedPromptIds.length + 1,
      );
      const updatedProgress: TranslationProgress = {
        currentDifficulty,
        completedPromptIds: updatedPromptIds,
        lastCompletedDate: today,
        totalCompleted,
      };

      if (existing) {
        await this.prisma.db.orm.public.UserTranslationProgress.where({
          userId,
        }).update({
          lastCompletedDate: today,
          currentDifficulty,
          completedPromptIds: updatedPromptIds,
          totalCompleted,
        });
      } else {
        await this.prisma.db.orm.public.UserTranslationProgress.create({
          userId,
          lastCompletedDate: today,
          currentDifficulty,
          completedPromptIds: updatedPromptIds,
          totalCompleted,
        });
      }

      const newState = buildTranslationDailyState(updatedProgress, today, prompts);

      return {
        isCorrect: true,
        alreadyLockedToday: false,
        canonicalAnswer: result.canonicalAnswer,
        answerReading: result.answerReading,
        explanation: result.explanation,
        state: newState,
      };
    }

    return {
      isCorrect: false,
      alreadyLockedToday: false,
      canonicalAnswer: result.canonicalAnswer,
      answerReading: result.answerReading,
      explanation: result.explanation,
      state,
    };
  }

  async devUnlock(
    userId: string,
    body?: DevUnlockTranslationInput,
    localDate?: string,
  ): Promise<TranslationDailyState> {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Dev unlock is disabled in production");
    }

    let today = getTodayLocalDate();
    if (localDate !== undefined) {
      const parsedDate = LocalDateSchema.safeParse(localDate);
      if (!parsedDate.success) {
        throw new BadRequestException("Invalid localDate format. Expected YYYY-MM-DD");
      }
      today = parsedDate.data;
    }

    const parsedBody = DevUnlockTranslationSchema.safeParse(body ?? {});
    if (!parsedBody.success) {
      throw new BadRequestException("Invalid dev unlock input");
    }

    const { existing, progress } = await this.loadProgress(userId);
    const completedPromptIds = progress.completedPromptIds;

    let updatedProgress: TranslationProgress;
    if (parsedBody.data.resetAll) {
      updatedProgress = {
        currentDifficulty: 1,
        completedPromptIds: [],
        lastCompletedDate: null,
        totalCompleted: 0,
      };
    } else {
      updatedProgress = {
        currentDifficulty: existing?.currentDifficulty ?? 1,
        completedPromptIds,
        lastCompletedDate: null,
        totalCompleted: existing?.totalCompleted ?? completedPromptIds.length,
      };
    }

    if (existing) {
      await this.prisma.db.orm.public.UserTranslationProgress.where({
        userId,
      }).update({
        currentDifficulty: updatedProgress.currentDifficulty,
        completedPromptIds: updatedProgress.completedPromptIds,
        lastCompletedDate: updatedProgress.lastCompletedDate,
        totalCompleted: updatedProgress.totalCompleted,
      });
    } else {
      await this.prisma.db.orm.public.UserTranslationProgress.create({
        userId,
        currentDifficulty: updatedProgress.currentDifficulty,
        completedPromptIds: updatedProgress.completedPromptIds,
        lastCompletedDate: updatedProgress.lastCompletedDate,
        totalCompleted: updatedProgress.totalCompleted,
      });
    }

    const prompts = await this.getPrompts();
    return buildTranslationDailyState(updatedProgress, today, prompts);
  }
}
