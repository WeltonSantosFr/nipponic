import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  calculateNextDailyDate,
  calculateOverdueTargetDate,
  adjustForQuietHours,
  getNotificationSettings,
  saveNotificationSettings,
  DEFAULT_NOTIFICATION_SETTINGS,
} from "./notifications";
import type { Card } from "@nipponic/shared";

describe("Notifications Service", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("adjustForQuietHours", () => {
    it("should postpone notifications scheduled at night (>= 22:00) to 09:00 AM the next day", () => {
      const lateNight = new Date(2026, 8, 20, 23, 30); // 23:30
      const adjusted = adjustForQuietHours(lateNight);

      expect(adjusted.getDate()).toBe(21);
      expect(adjusted.getHours()).toBe(9);
      expect(adjusted.getMinutes()).toBe(0);
    });

    it("should postpone early morning notifications (< 08:00) to 09:00 AM the same day", () => {
      const earlyMorning = new Date(2026, 8, 20, 4, 15); // 04:15
      const adjusted = adjustForQuietHours(earlyMorning);

      expect(adjusted.getDate()).toBe(20);
      expect(adjusted.getHours()).toBe(9);
      expect(adjusted.getMinutes()).toBe(0);
    });

    it("should leave daytime notifications unchanged", () => {
      const daytime = new Date(2026, 8, 20, 14, 45); // 14:45
      const adjusted = adjustForQuietHours(daytime);

      expect(adjusted.getDate()).toBe(20);
      expect(adjusted.getHours()).toBe(14);
      expect(adjusted.getMinutes()).toBe(45);
    });
  });

  describe("calculateNextDailyDate", () => {
    it("should schedule for today if the time has not yet passed", () => {
      const fromDate = new Date(2026, 8, 20, 10, 0); // 10:00 AM
      const nextDate = calculateNextDailyDate("20:00", fromDate);

      expect(nextDate.getDate()).toBe(20);
      expect(nextDate.getHours()).toBe(20);
      expect(nextDate.getMinutes()).toBe(0);
    });

    it("should schedule for tomorrow if the time has already passed today", () => {
      const fromDate = new Date(2026, 8, 20, 21, 30); // 21:30 PM
      const nextDate = calculateNextDailyDate("20:00", fromDate);

      expect(nextDate.getDate()).toBe(21);
      expect(nextDate.getHours()).toBe(20);
      expect(nextDate.getMinutes()).toBe(0);
    });
  });

  const createMockCard = (id: string, jpText: string, enText: string, nextReviewAt?: string): Card => ({
    id,
    jpText,
    enText,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    lapses: 0,
    nextReviewAt,
  });

  describe("calculateOverdueTargetDate", () => {
    it("should return null if total cards is less than threshold", () => {
      const cards: Card[] = [
        createMockCard("c1", "犬", "dog"),
        createMockCard("c2", "猫", "cat"),
      ];

      const target = calculateOverdueTargetDate(cards, 15);
      expect(target).toBeNull();
    });

    it("should return a target date when user already has >= 15 cards due", () => {
      const fromDate = new Date(2026, 8, 20, 10, 0); // 10:00 AM
      const cards: Card[] = Array.from({ length: 16 }, (_, i) =>
        createMockCard(`c${i}`, `Word ${i}`, `Def ${i}`, new Date(2026, 8, 19).toISOString())
      );

      const target = calculateOverdueTargetDate(cards, 15, fromDate);
      expect(target).not.toBeNull();
      // Expect default delay of 4h (10:00 + 4h = 14:00)
      expect(target?.getHours()).toBe(14);
    });

    it("should calculate exact future date when 15th card will mature", () => {
      const fromDate = new Date(2026, 8, 20, 10, 0); // 10:00 AM

      // 10 cards already due
      const dueCards: Card[] = Array.from({ length: 10 }, (_, i) =>
        createMockCard(`due_${i}`, `Due ${i}`, `Def ${i}`, new Date(2026, 8, 19).toISOString())
      );

      // 10 cards maturing in the future
      // 5th future card matures at 15:00 on Sept 20
      const futureCards: Card[] = Array.from({ length: 10 }, (_, i) =>
        createMockCard(
          `future_${i}`,
          `Future ${i}`,
          `Def ${i}`,
          new Date(2026, 8, 20, 11 + i, 0).toISOString()
        )
      );

      const allCards = [...dueCards, ...futureCards];
      // 10 due + 5th future card (index 4) will be the 15th overdue card
      // futureCards[4] has hour 11 + 4 = 15:00
      const target = calculateOverdueTargetDate(allCards, 15, fromDate);

      expect(target).not.toBeNull();
      expect(target?.getHours()).toBe(15);
      expect(target?.getMinutes()).toBe(0);
    });
  });

  describe("Settings Persistence", () => {
    it("should return default settings when nothing is stored", () => {
      const settings = getNotificationSettings();
      expect(settings).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
    });

    it("should persist and retrieve customized settings", () => {
      saveNotificationSettings({
        enabled: true,
        dailyReminder: false,
        dailyTime: "21:30",
        overdueAlert: true,
        overdueThreshold: 20,
      });

      const settings = getNotificationSettings();
      expect(settings.dailyReminder).toBe(false);
      expect(settings.dailyTime).toBe("21:30");
      expect(settings.overdueThreshold).toBe(20);
    });
  });
});
