import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  enqueueReview,
  clearPendingReviews,
  getPendingCount,
  resetDBPromise,
} from "@/lib/offline-db";
import {
  syncPendingReviews,
  subscribeOfflineSync,
  getOfflineSyncState,
  initOfflineSync,
  resetOfflineSyncForTesting,
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
});
