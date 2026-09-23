import {
  getPendingReviews,
  removePendingReview,
  incrementReviewAttempts,
  getPendingCount,
} from "@/lib/offline-db";
import { reviewCardAction } from "@/actions/cards";

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
}

type SyncListener = (state: OfflineSyncState) => void;

let state: OfflineSyncState = {
  isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
};

const listeners = new Set<SyncListener>();
let isInitialized = false;
let globalOnSyncedCallback: (() => void) | null = null;

function notifyListeners(): void {
  const currentState = { ...state };
  for (const listener of listeners) {
    try {
      listener(currentState);
    } catch (e) {
      console.error("[offline-sync] Listener error:", e);
    }
  }
}

export function getOfflineSyncState(): OfflineSyncState {
  return { ...state };
}

export function subscribeOfflineSync(listener: SyncListener): () => void {
  listeners.add(listener);
  listener({ ...state });
  return () => {
    listeners.delete(listener);
  };
}

export async function refreshPendingCount(): Promise<number> {
  const count = await getPendingCount();
  state = { ...state, pendingCount: count };
  notifyListeners();
  return count;
}

export async function syncPendingReviews(
  onSynced?: () => void
): Promise<{ syncedCount: number; remainingCount: number }> {
  if (state.isSyncing) {
    return { syncedCount: 0, remainingCount: state.pendingCount };
  }

  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  state = { ...state, isOnline };

  if (!isOnline) {
    await refreshPendingCount();
    return { syncedCount: 0, remainingCount: state.pendingCount };
  }

  const pending = await getPendingReviews();
  if (pending.length === 0) {
    state = { ...state, pendingCount: 0 };
    notifyListeners();
    return { syncedCount: 0, remainingCount: 0 };
  }

  state = { ...state, isSyncing: true };
  notifyListeners();

  let syncedCount = 0;

  try {
    for (const item of pending) {
      if (!item.id) continue;

      try {
        const result = await reviewCardAction(item.cardId, item.rating);
        if (result) {
          await removePendingReview(item.id);
          syncedCount++;
        } else {
          // If the action returned null (card not found / deleted or auth failed)
          // Increment attempts, if > 5 discard terminal item
          if (item.attempts >= 5) {
            console.warn(
              `[offline-sync] Discarding pending review for card ${item.cardId} after ${item.attempts} attempts`
            );
            await removePendingReview(item.id);
          } else {
            await incrementReviewAttempts(item.id);
          }
        }
      } catch (err: unknown) {
        console.error(
          `[offline-sync] Failed to sync review for card ${item.cardId}:`,
          err
        );
        if (item.attempts >= 5) {
          await removePendingReview(item.id);
        } else {
          await incrementReviewAttempts(item.id);
        }
      }
    }
  } finally {
    const remainingCount = await getPendingCount();
    state = {
      ...state,
      isSyncing: false,
      pendingCount: remainingCount,
      lastSyncedAt: syncedCount > 0 ? new Date() : state.lastSyncedAt,
    };
    notifyListeners();

    if (syncedCount > 0) {
      onSynced?.();
      globalOnSyncedCallback?.();
    }
  }

  return { syncedCount, remainingCount: state.pendingCount };
}

export function initOfflineSync(onSynced?: () => void): () => void {
  if (onSynced) {
    globalOnSyncedCallback = onSynced;
  }

  if (isInitialized || typeof window === "undefined") {
    return () => {};
  }
  isInitialized = true;

  const handleOnline = () => {
    state = { ...state, isOnline: true };
    notifyListeners();
    syncPendingReviews(onSynced).catch((e) =>
      console.error("[offline-sync] Auto-sync failed:", e)
    );
  };

  const handleOffline = () => {
    state = { ...state, isOnline: false };
    notifyListeners();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  // Initial pending count check & sync if online
  refreshPendingCount().then((count) => {
    if (count > 0 && navigator.onLine) {
      syncPendingReviews(onSynced).catch(() => {});
    }
  });

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
    isInitialized = false;
  };
}

// Reset internal state for test runner
export function resetOfflineSyncForTesting(): void {
  isInitialized = false;
  globalOnSyncedCallback = null;
  listeners.clear();
  state = {
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
  };
}
