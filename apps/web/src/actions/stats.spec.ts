import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getStudyStatsAction } from "./stats";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("getStudyStatsAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when token cookie is missing", async () => {
    const mockCookieStore = { get: vi.fn().mockReturnValue(undefined) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    const result = await getStudyStatsAction();
    expect(result).toBeNull();
  });

  it("returns parsed stats when fetch succeeds", async () => {
    const mockStats = {
      streak: { current: 4, longest: 7, lastStudiedAt: null, isActiveToday: true },
      today: { reviewsCount: 12, targetReviews: 20, retentionRate: 85 },
      cardsBreakdown: { total: 50, dueToday: 8, newCards: 10, learning: 15, mature: 25 },
      ratingsDistribution: { again: 1, hard: 2, good: 15, easy: 5, totalReviews: 23 },
      heatmap: [{ date: "2026-10-31", count: 12 }],
      forecast: [{ date: "2026-10-31", dayLabel: "Today", count: 8 }],
    };

    const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "jwt-token" }) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(mockStats),
    });

    const result = await getStudyStatsAction();
    expect(result).toEqual(mockStats);
  });

  it("returns null when upstream response is not ok", async () => {
    const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "jwt-token" }) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const result = await getStudyStatsAction();
    expect(result).toBeNull();
  });

  it("returns raw data fallback and logs error when schema validation fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const invalidSchemaData = { unexpectedKey: 123 };

    const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "jwt-token" }) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(invalidSchemaData),
    });

    const result = await getStudyStatsAction();
    expect(result).toEqual(invalidSchemaData);
    expect(consoleSpy).toHaveBeenCalledWith(
      "[stats] Invalid stats response schema:",
      expect.anything()
    );
    consoleSpy.mockRestore();
  });

  it("returns null on fetch error", async () => {
    const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "jwt-token" }) };
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await getStudyStatsAction();
    expect(result).toBeNull();
  });
});
