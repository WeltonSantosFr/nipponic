import { describe, it, expect, vi, beforeEach } from "vitest";
import { StatsService } from "./stats.service";
import { PrismaService } from "../prisma.service";

describe("StatsService", () => {
  let service: StatsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      connect: vi.fn().mockResolvedValue(undefined),
      db: {
        runtime: vi.fn().mockReturnValue({
          driver: { execute: vi.fn().mockResolvedValue({}) },
        }),
        $driver: { execute: vi.fn().mockResolvedValue({}) },
        orm: {
          public: {
            Card: {
              where: vi.fn().mockReturnValue({
                all: vi.fn(),
              }),
            },
            StudyLog: {
              create: vi.fn(),
              where: vi.fn().mockReturnValue({
                all: vi.fn(),
              }),
            },
          },
        },
      },
    };

    service = new StatsService(prismaMock as unknown as PrismaService);
  });

  describe("streak calculation", () => {
    it("calculates active streak when studied today and yesterday", async () => {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
      const twoDaysAgoStr = twoDaysAgo.toISOString().slice(0, 10);

      prismaMock.db.orm.public.Card.where().all.mockResolvedValue([]);
      prismaMock.db.orm.public.StudyLog.where().all.mockResolvedValue([
        { id: "1", rating: 3, reviewedAt: new Date(`${todayStr}T12:00:00Z`) },
        { id: "2", rating: 4, reviewedAt: new Date(`${yesterdayStr}T12:00:00Z`) },
        { id: "3", rating: 3, reviewedAt: new Date(`${twoDaysAgoStr}T12:00:00Z`) },
      ]);

      const stats = await service.getDashboardStats("usr_1");

      expect(stats.streak.current).toBe(3);
      expect(stats.streak.longest).toBe(3);
      expect(stats.streak.isActiveToday).toBe(true);
      expect(stats.today.reviewsCount).toBe(1);
    });

    it("keeps streak alive if studied yesterday but not yet today", async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      prismaMock.db.orm.public.Card.where().all.mockResolvedValue([]);
      prismaMock.db.orm.public.StudyLog.where().all.mockResolvedValue([
        { id: "1", rating: 3, reviewedAt: new Date(`${yesterdayStr}T12:00:00Z`) },
      ]);

      const stats = await service.getDashboardStats("usr_1");

      expect(stats.streak.current).toBe(1);
      expect(stats.streak.isActiveToday).toBe(false);
      expect(stats.today.reviewsCount).toBe(0);
    });

    it("resets streak to 0 if last studied 2 or more days ago", async () => {
      const now = new Date();
      const threeDaysAgo = new Date(now.getTime() - 72 * 60 * 60 * 1000);
      const threeDaysAgoStr = threeDaysAgo.toISOString().slice(0, 10);

      prismaMock.db.orm.public.Card.where().all.mockResolvedValue([]);
      prismaMock.db.orm.public.StudyLog.where().all.mockResolvedValue([
        { id: "1", rating: 3, reviewedAt: new Date(`${threeDaysAgoStr}T12:00:00Z`) },
      ]);

      const stats = await service.getDashboardStats("usr_1");

      expect(stats.streak.current).toBe(0);
      expect(stats.streak.longest).toBe(1);
      expect(stats.streak.isActiveToday).toBe(false);
    });
  });

  describe("cards memory stage breakdown", () => {
    it("categorizes cards correctly into new, learning, mature, and due", async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 10000);
      const future = new Date(now.getTime() + 100000000);

      const mockCards = [
        // New card (0 reps, due now)
        { id: "c1", repetitions: 0, interval: 0, nextReviewAt: null },
        // Learning card (reps > 0, interval < 21, due now)
        { id: "c2", repetitions: 2, interval: 5, nextReviewAt: past },
        // Mature card (interval >= 21, due in future)
        { id: "c3", repetitions: 5, interval: 30, nextReviewAt: future },
      ];

      prismaMock.db.orm.public.Card.where().all.mockResolvedValue(mockCards);
      prismaMock.db.orm.public.StudyLog.where().all.mockResolvedValue([]);

      const stats = await service.getDashboardStats("usr_1");

      expect(stats.cardsBreakdown.total).toBe(3);
      expect(stats.cardsBreakdown.dueToday).toBe(2);
      expect(stats.cardsBreakdown.newCards).toBe(1);
      expect(stats.cardsBreakdown.learning).toBe(1);
      expect(stats.cardsBreakdown.mature).toBe(1);
    });

    it("excludes orphan cards from cardsBreakdown when user decks exist", async () => {
      const now = new Date();
      const past = new Date(now.getTime() - 3600000);

      const deckCards = [
        { id: "c1", repetitions: 0, interval: 0, nextReviewAt: past },
        { id: "c2", repetitions: 1, interval: 2, nextReviewAt: past },
      ];
      const orphanCard = { id: "c3", repetitions: 0, interval: 0, nextReviewAt: past };

      prismaMock.db.orm.public.Card.where().all.mockResolvedValue([...deckCards, orphanCard]);
      prismaMock.db.orm.public.StudyLog.where().all.mockResolvedValue([]);
      prismaMock.db.orm.public.Deck = {
        where: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([{ id: "deck_1", userId: "usr_1" }]),
        }),
      };
      prismaMock.db.orm.public.DeckCard = {
        where: vi.fn().mockReturnValue({
          all: vi.fn().mockResolvedValue([
            { deckId: "deck_1", cardId: "c1" },
            { deckId: "deck_1", cardId: "c2" },
          ]),
        }),
      };

      const stats = await service.getDashboardStats("usr_1");

      expect(stats.cardsBreakdown.total).toBe(2);
      expect(stats.cardsBreakdown.dueToday).toBe(2);
    });
  });

  describe("schema initialization (ensureTablesExist)", () => {
    it("connects and executes table and index creation SQL via runtime driver", async () => {
      const executeMock = vi.fn().mockResolvedValue({});
      prismaMock.db.runtime = vi.fn().mockReturnValue({
        driver: { execute: executeMock },
      });

      await service.onModuleInit();

      expect(prismaMock.connect).toHaveBeenCalled();
      expect(executeMock).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining(`CREATE TABLE IF NOT EXISTS "public"."studyLog"`),
        })
      );
    });

    it("falls back to $driver if runtime().driver is not available", async () => {
      const fallbackExecute = vi.fn().mockResolvedValue({});
      prismaMock.db.runtime = vi.fn().mockReturnValue({});
      prismaMock.db.$driver = { execute: fallbackExecute };

      await service.ensureTablesExist();

      expect(fallbackExecute).toHaveBeenCalledWith(
        expect.objectContaining({
          sql: expect.stringContaining(`CREATE TABLE IF NOT EXISTS "public"."studyLog"`),
        })
      );
    });

    it("gracefully catches errors when table verification fails", async () => {
      prismaMock.db.runtime = vi.fn().mockImplementation(() => {
        throw new Error("Connection failed");
      });

      // Should not throw
      await expect(service.ensureTablesExist()).resolves.toBeUndefined();
    });
  });

  describe("bug regression: relation public.studyLog does not exist", () => {
    it("recovers and synthesizes logs from cards if StudyLog query throws relation error", async () => {
      const past = new Date("2026-10-30T10:00:00Z");
      const mockCards = [
        {
          id: "card_rev",
          userId: "usr_1",
          repetitions: 3,
          interval: 10,
          lastReviewedAt: past,
          nextReviewAt: new Date("2026-11-05T10:00:00Z"),
        },
      ];

      prismaMock.db.orm.public.Card.where().all.mockResolvedValue(mockCards);

      // Simulate the exact error: relation "public.studyLog" does not exist
      prismaMock.db.orm.public.StudyLog.where = vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error('SqlQueryError: relation "public.studyLog" does not exist')),
      });

      const stats = await service.getDashboardStats("usr_1");

      expect(stats).toBeDefined();
      expect(stats.cardsBreakdown.total).toBe(1);
      // Logs were synthesized from lastReviewedAt
      expect(stats.today.reviewsCount).toBe(0);
      expect(stats.streak.longest).toBe(1);
    });

    it("retries querying StudyLog after calling ensureTablesExist on error", async () => {
      prismaMock.db.orm.public.Card.where().all.mockResolvedValue([]);

      let attempts = 0;
      prismaMock.db.orm.public.StudyLog.where = vi.fn().mockReturnValue({
        all: vi.fn().mockImplementation(() => {
          attempts++;
          if (attempts === 1) {
            return Promise.reject(new Error('SqlQueryError: relation "public.studyLog" does not exist'));
          }
          return Promise.resolve([
            { id: "log_1", rating: 4, reviewedAt: new Date() },
          ]);
        }),
      });

      const ensureSpy = vi.spyOn(service, "ensureTablesExist");
      const stats = await service.getDashboardStats("usr_1");

      expect(ensureSpy).toHaveBeenCalled();
      expect(stats.today.reviewsCount).toBe(1);
      expect(stats.ratingsDistribution.easy).toBe(1);
    });

    it("survives total database failure when fetching cards and study logs", async () => {
      prismaMock.db.orm.public.Card.where = vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error("Connection reset")),
      });
      prismaMock.db.orm.public.StudyLog.where = vi.fn().mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error("Connection reset")),
      });

      const stats = await service.getDashboardStats("usr_1");

      expect(stats).toBeDefined();
      expect(stats.cardsBreakdown.total).toBe(0);
      expect(stats.today.reviewsCount).toBe(0);
      expect(stats.streak.current).toBe(0);
    });
  });

  describe("logReview", () => {
    it("persists review event into StudyLog", async () => {
      await service.logReview("usr_1", "card_1", 3);

      expect(prismaMock.db.orm.public.StudyLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "usr_1",
          cardId: "card_1",
          rating: 3,
        })
      );
    });

    it("attempts ensureTablesExist and retries if StudyLog.create fails initially", async () => {
      let attempts = 0;
      prismaMock.db.orm.public.StudyLog.create = vi.fn().mockImplementation(() => {
        attempts++;
        if (attempts === 1) {
          return Promise.reject(new Error('relation "public.studyLog" does not exist'));
        }
        return Promise.resolve({ id: "log_retried" });
      });

      const ensureSpy = vi.spyOn(service, "ensureTablesExist");
      await service.logReview("usr_1", "card_1", 3);

      expect(ensureSpy).toHaveBeenCalled();
      expect(attempts).toBe(2);
    });
  });
});
