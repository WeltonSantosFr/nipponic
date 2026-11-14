import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { TranslationService } from "./translation.service";
import { PrismaService } from "../prisma.service";
import { MVP_TRANSLATION_PROMPTS } from "@nipponic/shared";

describe("TranslationService", () => {
  let service: TranslationService;
  let mockPrisma: any;
  let progressStore: Record<string, any>;
  let attemptsStore: any[];
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    progressStore = {};
    attemptsStore = [];

    mockPrisma = {
      connect: vi.fn().mockResolvedValue(undefined),
      db: {
        orm: {
          public: {
            UserTranslationProgress: {
              first: vi.fn(async ({ userId }: { userId: string }) => {
                return progressStore[userId] ?? null;
              }),
              create: vi.fn(async (data: any) => {
                progressStore[data.userId] = { id: "prog-1", ...data };
                return progressStore[data.userId];
              }),
              where: vi.fn(({ userId }: { userId: string }) => ({
                update: vi.fn(async (patch: any) => {
                  progressStore[userId] = {
                    ...progressStore[userId],
                    ...patch,
                  };
                  return progressStore[userId];
                }),
              })),
            },
            TranslationAttempt: {
              create: vi.fn(async (data: any) => {
                const record = { id: `att-${attemptsStore.length + 1}`, ...data };
                attemptsStore.push(record);
                return record;
              }),
            },
          },
        },
      },
    };

    service = new TranslationService(mockPrisma as unknown as PrismaService);
  });

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  describe("getDailyState", () => {
    it("returns the first JP->EN prompt unlocked for a guest user", async () => {
      const state = await service.getDailyState(undefined, "2026-11-12");

      expect(state.prompt?.id).toBe(MVP_TRANSLATION_PROMPTS[0].id);
      expect(state.prompt?.direction).toBe("JP_TO_EN");
      expect(state.prompt?.difficulty).toBe(1);
      expect(state.isLockedToday).toBe(false);
      expect(state.allCompleted).toBe(false);
      expect(state.totalPrompts).toBe(4);
      expect(state.nextDifficultyLabel).toBe("Level 2 · Elementary");
    });

    it("throws BadRequestException on invalid localDate format", async () => {
      await expect(service.getDailyState("usr-1", "11/12/2026")).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("submitAttempt", () => {
    it("grades a correct normalized answer, advances difficulty, and locks the rest of the day", async () => {
      const res = await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[0].id,
        answer: "  please give me some water! ",
        localDate: "2026-11-12",
      });

      expect(res.isCorrect).toBe(true);
      expect(res.alreadyLockedToday).toBe(false);
      expect(res.state.progress.currentDifficulty).toBe(2);
      expect(res.state.progress.totalCompleted).toBe(1);
      expect(res.state.progress.lastCompletedDate).toBe("2026-11-12");
      expect(res.state.isLockedToday).toBe(true);
      expect(res.state.prompt?.id).toBe(MVP_TRANSLATION_PROMPTS[1].id);
      expect(attemptsStore).toHaveLength(1);
      expect(attemptsStore[0].isCorrect).toBe(true);
    });

    it("prevents completing a second sentence on the same day", async () => {
      await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[0].id,
        answer: "Water, please",
        localDate: "2026-11-12",
      });

      const second = await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[1].id,
        answer: "毎朝コーヒーを飲みます。",
        localDate: "2026-11-12",
      });

      expect(second.isCorrect).toBe(false);
      expect(second.alreadyLockedToday).toBe(true);
      expect(second.state.progress.totalCompleted).toBe(1);
      expect(attemptsStore).toHaveLength(1);
    });

    it("unlocks the next higher-difficulty EN->JP sentence on the following day", async () => {
      await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[0].id,
        answer: "Water please",
        localDate: "2026-11-12",
      });

      const nextDayState = await service.getDailyState("usr-1", "2026-11-13");
      expect(nextDayState.isLockedToday).toBe(false);
      expect(nextDayState.prompt?.id).toBe(MVP_TRANSLATION_PROMPTS[1].id);
      expect(nextDayState.prompt?.direction).toBe("EN_TO_JP");
      expect(nextDayState.prompt?.difficulty).toBe(2);

      const day2Submit = await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[1].id,
        answer: "毎朝コーヒーを飲みます",
        localDate: "2026-11-13",
      });

      expect(day2Submit.isCorrect).toBe(true);
      expect(day2Submit.state.progress.currentDifficulty).toBe(3);
      expect(day2Submit.state.progress.totalCompleted).toBe(2);
    });

    it("does not lock or advance on an incorrect translation so the user can retry", async () => {
      const res = await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[0].id,
        answer: "Good evening",
        localDate: "2026-11-12",
      });

      expect(res.isCorrect).toBe(false);
      expect(res.alreadyLockedToday).toBe(false);
      expect(res.state.isLockedToday).toBe(false);
      expect(res.state.progress.totalCompleted).toBe(0);
      expect(attemptsStore).toHaveLength(1);
      expect(attemptsStore[0].isCorrect).toBe(false);
    });

    it("marks allCompleted after all 4 MVP prompts succeed across 4 days", async () => {
      const answers = [
        "Please give me some water.",
        "毎朝コーヒーを飲みます。",
        "Because it's raining, I'll watch a movie at home.",
        "明日時間があれば、図書館に行くつもりです。",
      ];

      for (let i = 0; i < 4; i++) {
        const res = await service.submitAttempt("usr-1", {
          promptId: MVP_TRANSLATION_PROMPTS[i].id,
          answer: answers[i],
          localDate: `2026-11-${12 + i}`,
        });
        expect(res.isCorrect).toBe(true);
      }

      const finalState = await service.getDailyState("usr-1", "2026-11-16");
      expect(finalState.allCompleted).toBe(true);
      expect(finalState.prompt).toBeNull();
      expect(finalState.isLockedToday).toBe(false);
      expect(finalState.progress.totalCompleted).toBe(4);
    });

    it("throws BadRequestException when promptId does not match the active challenge", async () => {
      await expect(
        service.submitAttempt("usr-1", {
          promptId: MVP_TRANSLATION_PROMPTS[2].id,
          answer: "Because it is raining, I will watch a movie at home",
          localDate: "2026-11-12",
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("devUnlock", () => {
    it("clears the daily lock in non-production environments", async () => {
      process.env.NODE_ENV = "development";

      await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[0].id,
        answer: "Water please",
        localDate: "2026-11-12",
      });

      const unlocked = await service.devUnlock("usr-1", {}, "2026-11-12");
      expect(unlocked.isLockedToday).toBe(false);
      expect(unlocked.prompt?.id).toBe(MVP_TRANSLATION_PROMPTS[1].id);
      expect(unlocked.progress.totalCompleted).toBe(1);
    });

    it("resets all progress when resetAll is true", async () => {
      process.env.NODE_ENV = "test";

      await service.submitAttempt("usr-1", {
        promptId: MVP_TRANSLATION_PROMPTS[0].id,
        answer: "Water please",
        localDate: "2026-11-12",
      });

      const reset = await service.devUnlock(
        "usr-1",
        { resetAll: true },
        "2026-11-12",
      );
      expect(reset.isLockedToday).toBe(false);
      expect(reset.progress.totalCompleted).toBe(0);
      expect(reset.progress.currentDifficulty).toBe(1);
      expect(reset.prompt?.id).toBe(MVP_TRANSLATION_PROMPTS[0].id);
    });

    it("throws ForbiddenException in production", async () => {
      process.env.NODE_ENV = "production";
      await expect(service.devUnlock("usr-1", {})).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
