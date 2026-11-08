import { Inject, Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { StudyStats, HeatmapDay, ForecastDay } from "@nipponic/shared";

@Injectable()
export class StatsService implements OnModuleInit {
  private readonly logger = new Logger(StatsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      const driver = (this.prisma.db as any).$driver;
      if (!driver?.execute) return;

      const statements = [
        `CREATE TABLE IF NOT EXISTS "public"."studyLog" (
          "id" text NOT NULL,
          "userId" text NOT NULL,
          "cardId" text,
          "rating" int4 NOT NULL,
          "reviewedAt" timestamptz DEFAULT (now()) NOT NULL,
          "createdAt" timestamptz DEFAULT (now()) NOT NULL,
          PRIMARY KEY ("id")
        )`,
        `CREATE INDEX IF NOT EXISTS "studyLog_userId_reviewedAt_idx" ON "public"."studyLog" ("userId", "reviewedAt")`,
        `ALTER TABLE "public"."studyLog" DISABLE ROW LEVEL SECURITY`,
      ];

      for (const sql of statements) {
        await driver.execute({ sql, params: [] }).catch((err: unknown) => {
          this.logger.debug(
            `StudyLog schema check notice: ${err instanceof Error ? err.message : String(err)}`
          );
        });
      }
      this.logger.log("StudyLog database schema verified.");
    } catch (err) {
      this.logger.warn(`Could not verify StudyLog table: ${err}`);
    }
  }

  async logReview(userId: string, cardId: string, rating: number): Promise<void> {
    try {
      await this.prisma.db.orm.public.StudyLog.create({
        userId,
        cardId,
        rating,
        reviewedAt: new Date(),
      });
    } catch (err) {
      this.logger.warn(`Failed to log card review: ${err}`);
    }
  }

  async getDashboardStats(userId: string): Promise<StudyStats> {
    const now = new Date();

    // 1. Fetch user's cards
    let cards = await this.prisma.db.orm.public.Card.where({ userId }).all();

    // If user has active decks, restrict memory breakdown to cards assigned to active decks
    try {
      if (this.prisma?.db?.orm?.public?.Deck && this.prisma?.db?.orm?.public?.DeckCard) {
        const userDecks = await this.prisma.db.orm.public.Deck.where({ userId }).all();
        if (Array.isArray(userDecks) && userDecks.length > 0) {
          const deckIds = userDecks.map((d) => d.id);
          const deckCardsLists = await Promise.all(
            deckIds.map((deckId) =>
              this.prisma.db.orm.public.DeckCard.where({ deckId }).all()
            )
          );
          const activeCardIdSet = new Set<string>();
          for (const list of deckCardsLists) {
            if (Array.isArray(list)) {
              for (const dc of list) {
                activeCardIdSet.add(dc.cardId);
              }
            }
          }
          if (activeCardIdSet.size > 0) {
            cards = cards.filter((c) => activeCardIdSet.has(c.id));
          }
        }
      }
    } catch (err) {
      this.logger.warn(`Failed to filter active deck cards for stats: ${err}`);
    }

    // 2. Fetch user's study logs
    let logs = await this.prisma.db.orm.public.StudyLog.where({ userId }).all();

    // Graceful backfill: if no logs exist yet, synthesize logs from cards with lastReviewedAt
    if (logs.length === 0 && cards.some((c) => c.lastReviewedAt)) {
      logs = cards
        .filter((c) => c.lastReviewedAt)
        .map((c) => ({
          id: `syn-${c.id}`,
          userId,
          cardId: c.id,
          rating: 3, // Default to Good for existing reviewed cards
          reviewedAt: new Date(c.lastReviewedAt!),
          createdAt: new Date(c.lastReviewedAt!),
        }));
    }

    // 3. Cards memory breakdown
    const totalCards = cards.length;
    let dueTodayCount = 0;
    let newCardsCount = 0;
    let learningCount = 0;
    let matureCount = 0;

    for (const card of cards) {
      const isDue = !card.nextReviewAt || new Date(card.nextReviewAt) <= now;
      if (isDue) {
        dueTodayCount++;
      }

      const repetitions = card.repetitions ?? 0;
      const interval = card.interval ?? 0;

      if (repetitions === 0) {
        newCardsCount++;
      } else if (interval < 21) {
        learningCount++;
      } else {
        matureCount++;
      }
    }

    // 4. Ratings distribution
    let againCount = 0;
    let hardCount = 0;
    let goodCount = 0;
    let easyCount = 0;

    for (const log of logs) {
      if (log.rating === 1) againCount++;
      else if (log.rating === 2) hardCount++;
      else if (log.rating === 3) goodCount++;
      else if (log.rating === 4) easyCount++;
    }
    const totalReviews = logs.length;

    // 5. Today's stats
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    const todayLogs = logs.filter((l) => new Date(l.reviewedAt) >= todayStart);
    const todayReviewsCount = todayLogs.length;
    const targetReviews = 20;

    let retentionRate = 100;
    if (todayLogs.length > 0) {
      const successfulToday = todayLogs.filter((l) => l.rating >= 3).length;
      retentionRate = Math.round((successfulToday / todayLogs.length) * 100);
    } else if (totalReviews > 0) {
      retentionRate = Math.round(((goodCount + easyCount) / totalReviews) * 100);
    }

    // 6. Streak calculation
    const reviewDateSet = new Set<string>();
    for (const log of logs) {
      const dateStr = new Date(log.reviewedAt).toISOString().slice(0, 10);
      reviewDateSet.add(dateStr);
    }

    const todayStr = now.toISOString().slice(0, 10);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const isActiveToday = reviewDateSet.has(todayStr);
    let currentStreak = 0;

    if (isActiveToday || reviewDateSet.has(yesterdayStr)) {
      let checkDate = isActiveToday ? new Date(now) : yesterday;
      while (true) {
        const checkStr = checkDate.toISOString().slice(0, 10);
        if (reviewDateSet.has(checkStr)) {
          currentStreak++;
          checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak in entire history
    const sortedDates = Array.from(reviewDateSet).sort();
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDateTime: number | null = null;

    for (const dateStr of sortedDates) {
      const dateTime = new Date(`${dateStr}T00:00:00Z`).getTime();
      if (prevDateTime === null) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round((dateTime - prevDateTime) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      }
      prevDateTime = dateTime;
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    let lastStudiedAt: string | null = null;
    if (logs.length > 0) {
      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime()
      );
      lastStudiedAt = new Date(sortedLogs[0].reviewedAt).toISOString();
    }

    // 7. Heatmap (past 365 days / 52 weeks)
    const reviewCountsByDate = new Map<string, number>();
    for (const log of logs) {
      const dStr = new Date(log.reviewedAt).toISOString().slice(0, 10);
      reviewCountsByDate.set(dStr, (reviewCountsByDate.get(dStr) ?? 0) + 1);
    }

    const heatmap: HeatmapDay[] = [];
    const DAYS_IN_HEATMAP = 364; // Exactly 52 full weeks
    for (let i = DAYS_IN_HEATMAP - 1; i >= 0; i--) {
      const dayDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dStr = dayDate.toISOString().slice(0, 10);
      heatmap.push({
        date: dStr,
        count: reviewCountsByDate.get(dStr) ?? 0,
      });
    }

    // 8. Forecast (next 7 days)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const forecast: ForecastDay[] = [];

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dStr = targetDate.toISOString().slice(0, 10);
      const dayLabel = i === 0 ? "Today" : (dayNames[targetDate.getUTCDay()] ?? "Day");

      let countForDay = 0;
      for (const card of cards) {
        if (!card.nextReviewAt) {
          if (i === 0) countForDay++;
          continue;
        }
        const cardDue = new Date(card.nextReviewAt);
        const cardDueStr = cardDue.toISOString().slice(0, 10);

        if (i === 0) {
          // Include overdue cards in today's forecast
          if (cardDue <= targetDate || cardDueStr === dStr) {
            countForDay++;
          }
        } else {
          if (cardDueStr === dStr) {
            countForDay++;
          }
        }
      }

      forecast.push({
        date: dStr,
        dayLabel,
        count: countForDay,
      });
    }

    return {
      streak: {
        current: currentStreak,
        longest: longestStreak,
        lastStudiedAt,
        isActiveToday,
      },
      today: {
        reviewsCount: todayReviewsCount,
        targetReviews,
        retentionRate,
      },
      cardsBreakdown: {
        total: totalCards,
        dueToday: dueTodayCount,
        newCards: newCardsCount,
        learning: learningCount,
        mature: matureCount,
      },
      ratingsDistribution: {
        again: againCount,
        hard: hardCount,
        good: goodCount,
        easy: easyCount,
        totalReviews,
      },
      heatmap,
      forecast,
    };
  }
}
