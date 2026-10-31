import { describe, it, expect, vi } from "vitest";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";
import { AuthGuard } from "../auth/auth.guard";
import type { JwtPayload, StudyStats } from "@nipponic/shared";

describe("StatsController", () => {
  it("getDashboard requires AuthGuard", () => {
    const guards = Reflect.getMetadata(
      GUARDS_METADATA,
      StatsController.prototype.getDashboard
    );
    expect(guards).toContain(AuthGuard);
  });

  it("getDashboard returns stats for current user", async () => {
    const mockStats: StudyStats = {
      streak: { current: 5, longest: 10, lastStudiedAt: null, isActiveToday: true },
      today: { reviewsCount: 15, targetReviews: 20, retentionRate: 90 },
      cardsBreakdown: { total: 100, dueToday: 10, newCards: 20, learning: 30, mature: 50 },
      ratingsDistribution: { again: 2, hard: 3, good: 20, easy: 10, totalReviews: 35 },
      heatmap: [],
      forecast: [],
    };

    const statsServiceMock = {
      getDashboardStats: vi.fn().mockResolvedValue(mockStats),
    } as unknown as StatsService;

    const controller = new StatsController(statsServiceMock);
    const user = { sub: "usr_123", username: "kenji", email: "kenji@example.com" } as JwtPayload;

    const result = await controller.getDashboard(user);

    expect(result).toEqual(mockStats);
    expect(statsServiceMock.getDashboardStats).toHaveBeenCalledWith("usr_123");
  });
});
