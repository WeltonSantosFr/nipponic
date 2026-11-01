import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  enqueueReview,
  clearPendingReviews,
  getPendingCount,
  getPendingReviews,
  incrementReviewAttempts,
  resetDBPromise,
} from "@/lib/offline-db";
import {
  syncPendingReviews,
  subscribeOfflineSync,
  getOfflineSyncState,
  initOfflineSync,
  resetOfflineSyncForTesting,
  refreshPendingCount,
} from "./offline-sync";
import * as cardsActions from "@/actions/cards";
import { Card } from "@nipponic/shared";

vi.mock("@/actions/cards", () => ({
  reviewCardAction: vi.fn(),
}));

describe("offline-sync", () => {
  beforeEach(async () => {
    resetDBPromise();
    await clearPendingReviews();
    resetOfflineSyncForTesting();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default state and allow subscribers", () => {
    const state = getOfflineSyncState();
    expect(state.isSyncing).toBe(false);

    const listener = vi.fn();
    const unsubscribe = subscribeOfflineSync(listener);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        isSyncing: false,
        pendingCount: 0,
      })
    );

    unsubscribe();
  });

  it("should not sync if offline", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    await enqueueReview("card-1", 3);
    const result = await syncPendingReviews();

    expect(result.syncedCount).toBe(0);
    expect(cardsActions.reviewCardAction).not.toHaveBeenCalled();

    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  it("should sync pending reviews when online and remove from queue", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    await enqueueReview("card-1", 3);
    await enqueueReview("card-2", 4);

    vi.mocked(cardsActions.reviewCardAction).mockResolvedValue({
      id: "card-1",
      interval: 1,
    } as unknown as Card);

    const onSynced = vi.fn();
    const result = await syncPendingReviews(onSynced);

    expect(result.syncedCount).toBe(2);
    expect(result.remainingCount).toBe(0);
    expect(cardsActions.reviewCardAction).toHaveBeenCalledTimes(2);
    expect(onSynced).toHaveBeenCalledTimes(1);

    const pendingAfter = await getPendingCount();
    expect(pendingAfter).toBe(0);
  });

  it("should retain items that fail with non-terminal errors", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    await enqueueReview("card-1", 2);

    // Fail the review call
    vi.mocked(cardsActions.reviewCardAction).mockResolvedValue(null);

    const result = await syncPendingReviews();

    expect(result.syncedCount).toBe(0);
    expect(result.remainingCount).toBe(1);

    const remaining = await getPendingCount();
    expect(remaining).toBe(1);
  });

  it("should trigger sync when online event fires", async () => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });

    await enqueueReview("card-online", 3);
    vi.mocked(cardsActions.reviewCardAction).mockResolvedValue({
      id: "card-online",
    } as unknown as Card);

    const onSynced = vi.fn();
    const cleanup = initOfflineSync(onSynced);

    window.dispatchEvent(new Event("online"));

    // Wait a tick for async handler
    await new Promise((r) => setTimeout(r, 50));

    expect(cardsActions.reviewCardAction).toHaveBeenCalledWith("card-online", 3);
    cleanup();
  });

  it("should update state to offline when offline event fires", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeOfflineSync(listener);
    const cleanup = initOfflineSync();

    window.dispatchEvent(new Event("offline"));

    const state = getOfflineSyncState();
    expect(state.isOnline).toBe(false);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ isOnline: false })
    );

    cleanup();
    unsubscribe();
  });

  it("should return no-op cleanup when initOfflineSync is called more than once", () => {
    const cleanup1 = initOfflineSync();
    const cleanup2 = initOfflineSync();

    expect(typeof cleanup2).toBe("function");
    cleanup2();
    cleanup1();
  });

  it("should prevent concurrent sync operations when already syncing", async () => {
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    await enqueueReview("card-concurrent", 3);

    let concurrentSyncResult: any = null;

    // When reviewCardAction is executing, state.isSyncing is true
    vi.mocked(cardsActions.reviewCardAction).mockImplementation(async () => {
      // Trigger second sync concurrently
      concurrentSyncResult = await syncPendingReviews();
      return { id: "card-concurrent" } as any;
    });

    const res1 = await syncPendingReviews();

    expect(concurrentSyncResult).toEqual({
      syncedCount: 0,
      remainingCount: expect.any(Number),
    });
    expect(res1.syncedCount).toBe(1);
  });

  it("should log error if auto-sync fails inside online handler", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    // Mock openOfflineDB / getPendingReviews to reject
    const offlineDb = await import("@/lib/offline-db");
    vi.spyOn(offlineDb, "getPendingReviews").mockRejectedValueOnce(new Error("Fatal DB Error"));

    const cleanup = initOfflineSync();
    window.dispatchEvent(new Event("online"));

    await new Promise((r) => setTimeout(r, 50));
    expect(errorSpy).toHaveBeenCalledWith(
      "[offline-sync] Auto-sync failed:",
      expect.any(Error)
    );

    cleanup();
    errorSpy.mockRestore();
  });

  it("should discard pending review after 5 failed attempts when reviewCardAction returns null", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    await enqueueReview("card-discard-1", 1);
    const reviews = await getPendingReviews();
    const reviewId = reviews[0]!.id!;

    // Artificially increment attempts to 5
    for (let i = 0; i < 5; i++) {
      await incrementReviewAttempts(reviewId);
    }

    vi.mocked(cardsActions.reviewCardAction).mockResolvedValue(null);

    const result = await syncPendingReviews();
    expect(result.syncedCount).toBe(0);
    expect(result.remainingCount).toBe(0);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Discarding pending review for card card-discard-1 after 5 attempts")
    );

    const remaining = await getPendingCount();
    expect(remaining).toBe(0);
    warnSpy.mockRestore();
  });

  it("should discard pending review after 5 failed attempts when reviewCardAction throws an error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });

    await enqueueReview("card-discard-err", 1);
    const reviews = await getPendingReviews();
    const reviewId = reviews[0]!.id!;

    for (let i = 0; i < 5; i++) {
      await incrementReviewAttempts(reviewId);
    }

    vi.mocked(cardsActions.reviewCardAction).mockRejectedValue(new Error("Server permanently unavailable"));

    const result = await syncPendingReviews();
    expect(result.syncedCount).toBe(0);
    expect(result.remainingCount).toBe(0);
    expect(errorSpy).toHaveBeenCalled();

    const remaining = await getPendingCount();
    expect(remaining).toBe(0);
    errorSpy.mockRestore();
  });

  it("handles subscriber errors gracefully without interrupting notification loop", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const goodListener = vi.fn();
    let calls = 0;
    subscribeOfflineSync(() => {
      calls++;
      if (calls > 1) {
        throw new Error("faulty listener");
      }
    });
    subscribeOfflineSync(goodListener);

    await refreshPendingCount();
    expect(errorSpy).toHaveBeenCalledWith(
      "[offline-sync] Listener error:",
      expect.any(Error)
    );
    expect(goodListener).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("returns zero counts immediately when queue is empty", async () => {
    const result = await syncPendingReviews();
    expect(result).toEqual({ syncedCount: 0, remainingCount: 0 });
  });

  it("increments attempts when reviewCardAction throws and attempts < 5", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await enqueueReview("card-retry-err", 2);

    vi.mocked(cardsActions.reviewCardAction).mockRejectedValue(new Error("Network glitch"));

    const result = await syncPendingReviews();
    expect(result.syncedCount).toBe(0);
    expect(result.remainingCount).toBe(1);

    const pending = await getPendingReviews();
    expect(pending[0]?.attempts).toBe(1);
    errorSpy.mockRestore();
  });

  it("triggers both local onSynced and globalOnSyncedCallback", async () => {
    const globalOnSynced = vi.fn();
    const cleanup = initOfflineSync(globalOnSynced);

    // Calling initOfflineSync again returns no-op cleanup
    const secondCleanup = initOfflineSync();
    secondCleanup();

    await enqueueReview("card-dual-cb", 4);
    vi.mocked(cardsActions.reviewCardAction).mockResolvedValue({ id: "card-dual-cb" } as any);

    const localOnSynced = vi.fn();
    await syncPendingReviews(localOnSynced);

    expect(localOnSynced).toHaveBeenCalledTimes(1);
    expect(globalOnSynced).toHaveBeenCalledTimes(1);

    cleanup();
  });
});
