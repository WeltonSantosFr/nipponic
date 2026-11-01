import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  calculateNextDailyDate,
  calculateOverdueTargetDate,
  adjustForQuietHours,
  getNotificationSettings,
  saveNotificationSettings,
  isNotificationsSupported,
  requestNotificationPermission,
  initNotificationChannel,
  scheduleDailyReminder,
  scheduleOverdueCardsReminder,
  cancelAllReminders,
  sendTestNotification,
  syncCardNotifications,
  DEFAULT_NOTIFICATION_SETTINGS,
  NOTIFICATION_ID_DAILY,
  NOTIFICATION_ID_OVERDUE,
  NOTIFICATION_ID_TEST,
  NOTIFICATION_CHANNEL_ID,
} from "./notifications";
import type { Card } from "@nipponic/shared";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: {
    checkPermissions: vi.fn(),
    requestPermissions: vi.fn(),
    createChannel: vi.fn(),
    schedule: vi.fn(),
    cancel: vi.fn(),
  },
}));

describe("Notifications Service", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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

    it("should count cards without nextReviewAt as due immediately", () => {
      const fromDate = new Date(2026, 8, 20, 10, 0);
      const cardsWithoutDate: Card[] = Array.from({ length: 16 }, (_, i) =>
        createMockCard(`c_${i}`, "単語", "word", undefined)
      );

      const target = calculateOverdueTargetDate(cardsWithoutDate, 15, fromDate);
      expect(target).not.toBeNull();
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

    it("should fallback gracefully if localStorage json is malformed", () => {
      localStorage.setItem("nipponic.notifications.settings", "invalid-json-{");
      const settings = getNotificationSettings();
      expect(settings).toEqual(DEFAULT_NOTIFICATION_SETTINGS);
    });

    it("should handle localStorage.setItem throwing an error", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new Error("QuotaExceeded");
      });

      saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
      expect(warnSpy).toHaveBeenCalledWith(
        "[Notifications] Failed to save settings to localStorage:",
        expect.any(Error)
      );
      setItemSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });

  describe("Platform Support & Permissions", () => {
    it("should check native platform correctly", () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      expect(isNotificationsSupported()).toBe(true);

      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      expect(isNotificationsSupported()).toBe(false);
    });

    it("should return false for permission request if platform is not supported", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      const granted = await requestNotificationPermission();
      expect(granted).toBe(false);
    });

    it("should return true if checkPermissions is already granted", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({
        display: "granted",
      } as any);

      const granted = await requestNotificationPermission();
      expect(granted).toBe(true);
      expect(LocalNotifications.requestPermissions).not.toHaveBeenCalled();
    });

    it("should request permissions if checkPermissions is prompt and return true if user grants", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({
        display: "prompt",
      } as any);
      vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({
        display: "granted",
      } as any);

      const granted = await requestNotificationPermission();
      expect(granted).toBe(true);
      expect(LocalNotifications.requestPermissions).toHaveBeenCalled();
    });

    it("should return false if permission request throws an error", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.checkPermissions).mockRejectedValue(new Error("Permission API crashed"));

      const granted = await requestNotificationPermission();
      expect(granted).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("Notification Channel", () => {
    it("should not create channel if platform is not native", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      await initNotificationChannel();
      expect(LocalNotifications.createChannel).not.toHaveBeenCalled();
    });

    it("should create notification channel on native platform", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.createChannel).mockResolvedValue();

      await initNotificationChannel();

      expect(LocalNotifications.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: NOTIFICATION_CHANNEL_ID,
          name: "Study and Review Reminders",
        })
      );
    });

    it("should catch channel creation error gracefully without throwing", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.createChannel).mockRejectedValue(new Error("Channel error"));

      await initNotificationChannel();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe("Daily Reminder Scheduling", () => {
    it("should exit early if platform is not supported", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      await scheduleDailyReminder();
      expect(LocalNotifications.cancel).not.toHaveBeenCalled();
    });

    it("should cancel daily notification if dailyReminder is disabled", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();

      await scheduleDailyReminder({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        dailyReminder: false,
      });

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: NOTIFICATION_ID_DAILY }],
      });
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it("should cancel previous and schedule recurring daily reminder when enabled", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();
      vi.mocked(LocalNotifications.schedule).mockResolvedValue({ notifications: [] });

      await scheduleDailyReminder({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        dailyReminder: true,
        dailyTime: "20:00",
      });

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: NOTIFICATION_ID_DAILY }],
      });
      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: NOTIFICATION_ID_DAILY,
            title: "Time to study Japanese! 🎌",
            schedule: expect.objectContaining({
              every: "day",
              allowWhileIdle: true,
            }),
            channelId: NOTIFICATION_CHANNEL_ID,
          }),
        ],
      });
    });

    it("should catch schedule error and log error", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockRejectedValue(new Error("Failed to cancel"));

      await scheduleDailyReminder();

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("Overdue Cards Reminder Scheduling", () => {
    it("should exit early if platform is not supported", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      await scheduleOverdueCardsReminder([]);
      expect(LocalNotifications.cancel).not.toHaveBeenCalled();
    });

    it("should cancel reminder and exit if overdueAlert is disabled", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();

      await scheduleOverdueCardsReminder([], {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        overdueAlert: false,
      });

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [{ id: NOTIFICATION_ID_OVERDUE }],
      });
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it("should not schedule if not enough cards exist", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();

      await scheduleOverdueCardsReminder([createMockCard("1", "日", "sun")]);

      expect(LocalNotifications.cancel).toHaveBeenCalled();
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it("should respect 24-hour cooldown if notified recently", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();

      // Recent notification 2 hours ago
      localStorage.setItem(
        "nipponic.notifications.last_overdue_notify",
        new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      );

      const dueCards = Array.from({ length: 16 }, (_, i) =>
        createMockCard(`c_${i}`, "単語", "word", new Date(Date.now() - 1000).toISOString())
      );

      await scheduleOverdueCardsReminder(dueCards);

      expect(LocalNotifications.cancel).toHaveBeenCalled();
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it("should schedule overdue notification if target date is >= 24h away even if notified recently", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();
      vi.mocked(LocalNotifications.schedule).mockResolvedValue({ notifications: [] });

      // Recent notification 2 hours ago
      localStorage.setItem(
        "nipponic.notifications.last_overdue_notify",
        new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      );

      // Cards that mature 48 hours in the future
      const futureCards = Array.from({ length: 16 }, (_, i) =>
        createMockCard(`c_${i}`, "単語", "word", new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString())
      );

      await scheduleOverdueCardsReminder(futureCards);

      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: NOTIFICATION_ID_OVERDUE,
          }),
        ],
      });
    });

    it("should schedule overdue notification when threshold met and cooldown is expired", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();
      vi.mocked(LocalNotifications.schedule).mockResolvedValue({ notifications: [] });

      // Last notification was 48 hours ago
      localStorage.setItem(
        "nipponic.notifications.last_overdue_notify",
        new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      );

      const dueCards = Array.from({ length: 16 }, (_, i) =>
        createMockCard(`c_${i}`, "単語", "word", new Date(Date.now() - 1000).toISOString())
      );

      await scheduleOverdueCardsReminder(dueCards);

      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: NOTIFICATION_ID_OVERDUE,
            title: "Cards ready for review! 📚",
            channelId: NOTIFICATION_CHANNEL_ID,
          }),
        ],
      });
    });

    it("should log error if scheduling overdue cards throws", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockRejectedValue(new Error("Overdue cancel error"));

      await scheduleOverdueCardsReminder([]);

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("cancelAllReminders", () => {
    it("should do nothing if platform not supported", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      await cancelAllReminders();
      expect(LocalNotifications.cancel).not.toHaveBeenCalled();
    });

    it("should cancel daily, overdue, and test notifications on native platform", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();

      await cancelAllReminders();

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [
          { id: NOTIFICATION_ID_DAILY },
          { id: NOTIFICATION_ID_OVERDUE },
          { id: NOTIFICATION_ID_TEST },
        ],
      });
    });

    it("should catch cancel errors without throwing", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockRejectedValue(new Error("Cancel error"));

      await cancelAllReminders();
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("sendTestNotification", () => {
    it("should return false if platform is not supported", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      const res = await sendTestNotification();
      expect(res).toBe(false);
    });

    it("should return false if permission is not granted", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: "denied" } as any);
      vi.mocked(LocalNotifications.requestPermissions).mockResolvedValue({ display: "denied" } as any);

      const res = await sendTestNotification();
      expect(res).toBe(false);
      expect(LocalNotifications.schedule).not.toHaveBeenCalled();
    });

    it("should initialize channel, schedule test notification, and return true when permission is granted", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: "granted" } as any);
      vi.mocked(LocalNotifications.createChannel).mockResolvedValue();
      vi.mocked(LocalNotifications.schedule).mockResolvedValue({ notifications: [] });

      const res = await sendTestNotification();

      expect(res).toBe(true);
      expect(LocalNotifications.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: NOTIFICATION_ID_TEST,
            title: "Nipponic notifications active! 🎉",
            channelId: NOTIFICATION_CHANNEL_ID,
          }),
        ],
      });
    });

    it("should catch error and return false if scheduling test notification throws", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: "granted" } as any);
      vi.mocked(LocalNotifications.createChannel).mockResolvedValue();
      vi.mocked(LocalNotifications.schedule).mockRejectedValue(new Error("Schedule test notification error"));

      const res = await sendTestNotification();
      expect(res).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe("syncCardNotifications", () => {
    it("should return early if platform is not supported", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
      await syncCardNotifications([]);
      expect(LocalNotifications.cancel).not.toHaveBeenCalled();
    });

    it("should cancel all reminders if notifications are disabled in settings", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();

      saveNotificationSettings({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        enabled: false,
      });

      await syncCardNotifications([]);

      expect(LocalNotifications.cancel).toHaveBeenCalledWith({
        notifications: [
          { id: NOTIFICATION_ID_DAILY },
          { id: NOTIFICATION_ID_OVERDUE },
          { id: NOTIFICATION_ID_TEST },
        ],
      });
    });

    it("should schedule daily reminder and overdue cards reminder when enabled", async () => {
      vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
      vi.mocked(LocalNotifications.cancel).mockResolvedValue();
      vi.mocked(LocalNotifications.schedule).mockResolvedValue({ notifications: [] });

      saveNotificationSettings({
        ...DEFAULT_NOTIFICATION_SETTINGS,
        enabled: true,
      });

      const cards = Array.from({ length: 16 }, (_, i) =>
        createMockCard(`c_${i}`, "単語", "word", new Date(Date.now() - 1000).toISOString())
      );

      await syncCardNotifications(cards);

      expect(LocalNotifications.schedule).toHaveBeenCalledTimes(2);
    });
  });
});
