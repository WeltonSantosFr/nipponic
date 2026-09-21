import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import type { Card } from "@nipponic/shared";

export const NOTIFICATION_ID_DAILY = 1001;
export const NOTIFICATION_ID_OVERDUE = 1002;
export const NOTIFICATION_ID_TEST = 1003;
export const NOTIFICATION_CHANNEL_ID = "nipponic_reviews";

const STORAGE_KEY_SETTINGS = "nipponic.notifications.settings";
const STORAGE_KEY_LAST_OVERDUE_NOTIFY = "nipponic.notifications.last_overdue_notify";

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyTime: string; // Format: "HH:mm" e.g. "20:00"
  overdueAlert: boolean;
  overdueThreshold: number; // e.g. 15
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminder: true,
  dailyTime: "20:00",
  overdueAlert: true,
  overdueThreshold: 15,
};

/**
 * Checks if local notifications are available on the current platform
 */
export function isNotificationsSupported(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Reads notification settings from localStorage
 */
export function getNotificationSettings(): NotificationSettings {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATION_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (!raw) return DEFAULT_NOTIFICATION_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_NOTIFICATION_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_NOTIFICATION_SETTINGS;
  }
}

/**
 * Saves notification settings to localStorage
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.warn("[Notifications] Failed to save settings to localStorage:", e);
  }
}

/**
 * Requests notification permissions from the OS
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const current = await LocalNotifications.checkPermissions();
    if (current.display === "granted") return true;

    const result = await LocalNotifications.requestPermissions();
    return result.display === "granted";
  } catch (error) {
    console.error("[Notifications] Error requesting permissions:", error);
    return false;
  }
}

/**
 * Initializes the Android notification channel
 */
export async function initNotificationChannel(): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: "Lembretes de Estudo e Revisões",
      description: "Notificações para lembretes diários e cards pendentes para revisão",
      importance: 4, // High importance (sound, banner, heads-up)
      visibility: 1, // Public on lock screen
      vibration: true,
    });
  } catch (error) {
    console.warn("[Notifications] Failed to create notification channel:", error);
  }
}

/**
 * Adjusts a date so that it does not fire during Quiet Hours (22:00 - 08:00).
 * If the time falls in Quiet Hours, moves it to 09:00 AM.
 */
export function adjustForQuietHours(date: Date): Date {
  const result = new Date(date);
  const hours = result.getHours();

  if (hours >= 22) {
    // If after 22h, push to tomorrow at 09:00 AM
    result.setDate(result.getDate() + 1);
    result.setHours(9, 0, 0, 0);
  } else if (hours < 8) {
    // If before 08h, push to today at 09:00 AM
    result.setHours(9, 0, 0, 0);
  }

  return result;
}

/**
 * Calculates the next Date for a given daily "HH:mm" time.
 */
export function calculateNextDailyDate(timeStr: string, fromDate = new Date()): Date {
  const [hoursStr, minutesStr] = timeStr.split(":");
  const hours = parseInt(hoursStr || "20", 10);
  const minutes = parseInt(minutesStr || "0", 10);

  const target = new Date(fromDate);
  target.setHours(hours, minutes, 0, 0);

  // If time has already passed today, schedule for tomorrow
  if (target.getTime() <= fromDate.getTime()) {
    target.setDate(target.getDate() + 1);
  }

  return target;
}

/**
 * Calculates the exact future Date when `threshold` cards will be due.
 * Returns null if the user does not have enough cards to ever reach the threshold.
 */
export function calculateOverdueTargetDate(
  cards: Card[],
  threshold = 15,
  fromDate = new Date()
): Date | null {
  if (!cards || cards.length < threshold) {
    return null;
  }

  const nowMs = fromDate.getTime();
  const dueCards: Card[] = [];
  const futureCards: { card: Card; dueTime: number }[] = [];

  for (const card of cards) {
    if (!card.nextReviewAt) {
      dueCards.push(card);
    } else {
      const reviewTime = new Date(card.nextReviewAt).getTime();
      if (reviewTime <= nowMs) {
        dueCards.push(card);
      } else {
        futureCards.push({ card, dueTime: reviewTime });
      }
    }
  }

  // If the user already has >= threshold cards due right now
  if (dueCards.length >= threshold) {
    // Give user a sensible delay (e.g. 4 hours from now), adjusted for quiet hours
    const defaultDelay = new Date(nowMs + 4 * 60 * 60 * 1000);
    return adjustForQuietHours(defaultDelay);
  }

  // Otherwise, find when enough future cards will mature to cross the threshold
  const needed = threshold - dueCards.length;
  futureCards.sort((a, b) => a.dueTime - b.dueTime);

  if (futureCards.length >= needed && futureCards[needed - 1]) {
    const matureTime = futureCards[needed - 1]!.dueTime;
    const matureDate = new Date(matureTime);
    return adjustForQuietHours(matureDate);
  }

  return null;
}

/**
 * Schedules the recurring daily study reminder
 */
export async function scheduleDailyReminder(settings?: NotificationSettings): Promise<void> {
  if (!isNotificationsSupported()) return;
  const currentSettings = settings || getNotificationSettings();

  try {
    // Cancel existing daily reminder
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_ID_DAILY }],
    });

    if (!currentSettings.enabled || !currentSettings.dailyReminder) {
      return;
    }

    const nextDate = calculateNextDailyDate(currentSettings.dailyTime);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID_DAILY,
          title: "Hora de estudar japonês! 🎌",
          body: "Pratique alguns cards hoje para manter seu ritmo e fixar o vocabulário.",
          schedule: {
            at: nextDate,
            every: "day",
            allowWhileIdle: true,
          },
          channelId: NOTIFICATION_CHANNEL_ID,
          smallIcon: "ic_launcher_round",
        },
      ],
    });

    console.log("[Notifications] Scheduled daily reminder for:", nextDate.toLocaleString());
  } catch (error) {
    console.error("[Notifications] Failed to schedule daily reminder:", error);
  }
}

/**
 * Schedules the 15-cards overdue reminder based on current deck state
 */
export async function scheduleOverdueCardsReminder(
  cards: Card[],
  settings?: NotificationSettings
): Promise<void> {
  if (!isNotificationsSupported()) return;
  const currentSettings = settings || getNotificationSettings();

  try {
    // Cancel previous overdue alert
    await LocalNotifications.cancel({
      notifications: [{ id: NOTIFICATION_ID_OVERDUE }],
    });

    if (!currentSettings.enabled || !currentSettings.overdueAlert) {
      return;
    }

    const targetDate = calculateOverdueTargetDate(
      cards,
      currentSettings.overdueThreshold,
      new Date()
    );

    if (!targetDate) {
      return;
    }

    // Enforce 24-hour cooldown between overdue alert firings
    if (typeof window !== "undefined") {
      const lastNotify = localStorage.getItem(STORAGE_KEY_LAST_OVERDUE_NOTIFY);
      if (lastNotify) {
        const lastNotifyMs = new Date(lastNotify).getTime();
        const nowMs = Date.now();
        if (nowMs - lastNotifyMs < 24 * 60 * 60 * 1000) {
          // If we notified in last 24h, skip scheduling another immediate overdue alert
          if (targetDate.getTime() - nowMs < 24 * 60 * 60 * 1000) {
            return;
          }
        }
      }
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID_OVERDUE,
          title: "Cards acumulados para revisão! 📚",
          body: `Você tem ${currentSettings.overdueThreshold} ou mais cards prontos para revisão no Nipponic.`,
          schedule: {
            at: targetDate,
            allowWhileIdle: true,
          },
          channelId: NOTIFICATION_CHANNEL_ID,
          smallIcon: "ic_launcher_round",
        },
      ],
    });

    console.log("[Notifications] Scheduled overdue cards reminder for:", targetDate.toLocaleString());
  } catch (error) {
    console.error("[Notifications] Failed to schedule overdue cards reminder:", error);
  }
}

/**
 * Cancels all scheduled Nipponic reminders
 */
export async function cancelAllReminders(): Promise<void> {
  if (!isNotificationsSupported()) return;
  try {
    await LocalNotifications.cancel({
      notifications: [
        { id: NOTIFICATION_ID_DAILY },
        { id: NOTIFICATION_ID_OVERDUE },
        { id: NOTIFICATION_ID_TEST },
      ],
    });
    console.log("[Notifications] Cancelled all reminders");
  } catch (error) {
    console.error("[Notifications] Failed to cancel reminders:", error);
  }
}

/**
 * Triggers an immediate test notification in 2 seconds
 */
export async function sendTestNotification(): Promise<boolean> {
  if (!isNotificationsSupported()) return false;
  try {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return false;

    await initNotificationChannel();

    await LocalNotifications.schedule({
      notifications: [
        {
          id: NOTIFICATION_ID_TEST,
          title: "Notificações do Nipponic ativas! 🎉",
          body: "Tudo pronto! Você receberá lembretes inteligentes para manter seus estudos em dia.",
          schedule: {
            at: new Date(Date.now() + 2000), // 2 seconds from now
            allowWhileIdle: true,
          },
          channelId: NOTIFICATION_CHANNEL_ID,
          smallIcon: "ic_launcher_round",
        },
      ],
    });

    return true;
  } catch (error) {
    console.error("[Notifications] Failed to send test notification:", error);
    return false;
  }
}

/**
 * Synchronizes both daily reminders and overdue cards reminder
 */
export async function syncCardNotifications(cards: Card[]): Promise<void> {
  if (!isNotificationsSupported()) return;
  const settings = getNotificationSettings();
  if (!settings.enabled) {
    await cancelAllReminders();
    return;
  }

  await scheduleDailyReminder(settings);
  await scheduleOverdueCardsReminder(cards, settings);
}
