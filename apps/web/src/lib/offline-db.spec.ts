import { describe, it, expect, beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import {
  getCachedCards,
  saveCachedCards,
  getCachedDecks,
  saveCachedDecks,
  enqueueReview,
  getPendingReviews,
  removePendingReview,
  incrementReviewAttempts,
  getPendingCount,
  clearPendingReviews,
  resetDBPromise,
} from "./offline-db";
import { Card, Deck } from "@nipponic/shared";

describe("offline-db", () => {
  beforeEach(async () => {
    resetDBPromise();
    await clearPendingReviews();
  });

  const mockCards: Card[] = [
    {
      id: "card-1",
      jpText: "猫",
      enText: "Cat",
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      lapses: 0,
      nextReviewAt: "2026-09-23T12:00:00.000Z",
      lastReviewedAt: "2026-09-22T12:00:00.000Z",
      createdAt: "2026-09-20T12:00:00.000Z",
      updatedAt: "2026-09-22T12:00:00.000Z",
    },
    {
      id: "card-2",
      jpText: "犬",
      enText: "Dog",
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: "2026-09-23T10:00:00.000Z",
      lastReviewedAt: null,
      createdAt: "2026-09-21T12:00:00.000Z",
      updatedAt: "2026-09-21T12:00:00.000Z",
    },
  ];

  const mockDecks: Deck[] = [
    {
      id: "deck-1",
      name: "Animals",
      isPublic: false,
      cards: mockCards,
      createdAt: "2026-09-20T12:00:00.000Z",
      updatedAt: "2026-09-22T12:00:00.000Z",
    },
  ];

  it("should cache and retrieve cards correctly", async () => {
    await saveCachedCards(mockCards);
    const cached = await getCachedCards();
    expect(cached).toHaveLength(2);
    expect(cached.find((c) => c.id === "card-1")?.jpText).toBe("猫");
  });

  it("should overwrite cached cards when saving new list", async () => {
    await saveCachedCards(mockCards);
    await saveCachedCards([mockCards[0]!]);
    const cached = await getCachedCards();
    expect(cached).toHaveLength(1);
    expect(cached[0]?.id).toBe("card-1");
  });

  it("should cache and retrieve decks correctly", async () => {
    await saveCachedDecks(mockDecks);
    const cached = await getCachedDecks();
    expect(cached).toHaveLength(1);
    expect(cached[0]?.name).toBe("Animals");
    expect(cached[0]?.cards).toHaveLength(2);
  });

  it("should enqueue and retrieve pending reviews", async () => {
    const id1 = await enqueueReview("card-1", 3);
    const id2 = await enqueueReview("card-2", 1);

    expect(id1).toBeDefined();
    expect(id2).toBeDefined();

    const pending = await getPendingReviews();
    expect(pending).toHaveLength(2);
    expect(pending[0]?.cardId).toBe("card-1");
    expect(pending[0]?.rating).toBe(3);
    expect(pending[0]?.attempts).toBe(0);

    const count = await getPendingCount();
    expect(count).toBe(2);
  });

  it("should remove pending review by id", async () => {
    const id = await enqueueReview("card-1", 4);
    expect(id).toBeDefined();

    const initialPending = await getPendingReviews();
    const reviewId = initialPending[0]?.id;
    expect(reviewId).toBeDefined();

    const removed = await removePendingReview(reviewId!);
    expect(removed).toBe(true);

    const count = await getPendingCount();
    expect(count).toBe(0);
  });

  it("should increment review attempts", async () => {
    await enqueueReview("card-1", 2);
    const pending = await getPendingReviews();
    const reviewId = pending[0]?.id;
    expect(reviewId).toBeDefined();

    await incrementReviewAttempts(reviewId as number);
    const updated = await getPendingReviews();
    expect(updated[0]?.attempts).toBe(1);
  });

  it("should not clear cached cards if empty array is passed", async () => {
    await saveCachedCards(mockCards);
    await saveCachedCards([]);
    const cached = await getCachedCards();
    expect(cached).toHaveLength(2);
  });

  it("should not clear cached decks if empty array is passed", async () => {
    await saveCachedDecks(mockDecks);
    await saveCachedDecks([]);
    const cached = await getCachedDecks();
    expect(cached).toHaveLength(1);
  });

  it("should fallback to localStorage when IndexedDB cards store is empty", async () => {
    localStorage.setItem("nipponic.cached_cards", JSON.stringify(mockCards));
    // Clear indexedDB cache
    const db = await (await import("./offline-db")).openOfflineDB();
    const tx = db!.transaction("cards", "readwrite");
    tx.objectStore("cards").clear();
    await new Promise((r) => { tx.oncomplete = r; });

    const cached = await getCachedCards();
    expect(cached).toHaveLength(2);
    expect(cached[0]?.id).toBe("card-1");
  });

  it("should fallback to localStorage when IndexedDB decks store is empty", async () => {
    localStorage.setItem("nipponic.cached_decks", JSON.stringify(mockDecks));
    const db = await (await import("./offline-db")).openOfflineDB();
    const tx = db!.transaction("decks", "readwrite");
    tx.objectStore("decks").clear();
    await new Promise((r) => { tx.oncomplete = r; });

    const cached = await getCachedDecks();
    expect(cached).toHaveLength(1);
    expect(cached[0]?.id).toBe("deck-1");

    // Both IDB and localStorage are empty
    localStorage.clear();
    expect(await getCachedCards()).toEqual([]);
    expect(await getCachedDecks()).toEqual([]);

    // IDB is empty and localStorage has corrupt JSON
    localStorage.setItem("nipponic.cached_cards", "corrupted{");
    localStorage.setItem("nipponic.cached_decks", "corrupted{");
    expect(await getCachedCards()).toEqual([]);
    expect(await getCachedDecks()).toEqual([]);
    localStorage.clear();
  });

  it("should handle incrementReviewAttempts for non-existent id gracefully", async () => {
    await expect(incrementReviewAttempts(999999)).resolves.not.toThrow();
  });

  it("should fallback when window.indexedDB is unavailable", async () => {
    resetDBPromise();
    const originalIDB = window.indexedDB;
    Object.defineProperty(window, "indexedDB", {
      value: undefined,
      configurable: true,
    });

    localStorage.setItem("nipponic.cached_cards", JSON.stringify(mockCards));
    localStorage.setItem("nipponic.cached_decks", JSON.stringify(mockDecks));

    const cards = await getCachedCards();
    const decks = await getCachedDecks();
    const enqueueResult = await enqueueReview("c-1", 3);
    const count = await getPendingCount();
    const pending = await getPendingReviews();
    const removed = await removePendingReview(1);
    await saveCachedCards(mockCards);
    await saveCachedDecks(mockDecks);
    await incrementReviewAttempts(1);
    await clearPendingReviews();

    expect(cards).toHaveLength(2);
    expect(decks).toHaveLength(1);
    expect(enqueueResult).toBeNull();
    expect(count).toBe(0);
    expect(pending).toEqual([]);
    expect(removed).toBe(false);

    // Corrupted localStorage JSON handling
    localStorage.setItem("nipponic.cached_cards", "invalid json{");
    localStorage.setItem("nipponic.cached_decks", "invalid json{");
    expect(await getCachedCards()).toEqual([]);
    expect(await getCachedDecks()).toEqual([]);

    // localStorage write errors
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Quota exceeded");
    });
    await expect(saveCachedCards(mockCards)).resolves.not.toThrow();
    await expect(saveCachedDecks(mockDecks)).resolves.not.toThrow();
    setItemSpy.mockRestore();

    Object.defineProperty(window, "indexedDB", {
      value: originalIDB,
      configurable: true,
    });
    resetDBPromise();
  });

  it("should handle error when opening IndexedDB fails", async () => {
    resetDBPromise();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const originalOpen = window.indexedDB.open;

    window.indexedDB.open = vi.fn().mockImplementation(() => {
      const req: any = {};
      setTimeout(() => {
        req.onerror?.(new Error("IndexedDB blocked by user"));
      }, 0);
      return req;
    });

    const { openOfflineDB } = await import("./offline-db");
    const db = await openOfflineDB();

    expect(db).toBeNull();
    expect(errorSpy).toHaveBeenCalled();

    // Also test synchronous open error
    resetDBPromise();
    window.indexedDB.open = vi.fn().mockImplementation(() => {
      throw new Error("Access denied sync");
    });
    const dbSyncErr = await openOfflineDB();
    expect(dbSyncErr).toBeNull();

    window.indexedDB.open = originalOpen;
    errorSpy.mockRestore();
    resetDBPromise();
  });

  it("should return cached promise when openOfflineDB is called multiple times", async () => {
    resetDBPromise();
    const { openOfflineDB } = await import("./offline-db");
    const p1 = openOfflineDB();
    const p2 = openOfflineDB();
    expect(p1).toBe(p2);
    await p1;
  });

  it("should catch transaction exceptions and fallback to localStorage in getCachedCards and getCachedDecks", async () => {
    const db = await (await import("./offline-db")).openOfflineDB();
    const originalTransaction = db!.transaction;

    localStorage.setItem("nipponic.cached_cards", JSON.stringify(mockCards));
    localStorage.setItem("nipponic.cached_decks", JSON.stringify(mockDecks));

    // Force transaction to throw
    db!.transaction = vi.fn().mockImplementation(() => {
      throw new Error("Transaction closed");
    });

    const cards = await getCachedCards();
    const decks = await getCachedDecks();
    await saveCachedCards(mockCards);
    await saveCachedDecks(mockDecks);
    const count = await getPendingCount();
    const pending = await getPendingReviews();
    const removed = await removePendingReview(1);
    await incrementReviewAttempts(1);
    await clearPendingReviews();

    expect(cards).toHaveLength(2);
    expect(decks).toHaveLength(1);
    expect(count).toBe(0);
    expect(pending).toEqual([]);
    expect(removed).toBe(false);

    // Call enqueueReview while transaction throws (line 280)
    const enqRes = await enqueueReview("c-throw", 3);
    expect(enqRes).toBeNull();

    // Call getCachedCards and getCachedDecks when localStorage is empty and transaction throws (lines 133 & 220)
    localStorage.clear();
    const emptyCardsThrow = await getCachedCards();
    const emptyDecksThrow = await getCachedDecks();
    expect(emptyCardsThrow).toEqual([]);
    expect(emptyDecksThrow).toEqual([]);

    db!.transaction = originalTransaction;
  });

  it("should handle request.onerror and tx.onerror events gracefully across all operations", async () => {
    const db = await (await import("./offline-db")).openOfflineDB();
    const origTx = db!.transaction.bind(db);

    vi.spyOn(db!, "transaction").mockImplementation((storeNames: any, mode: any) => {
      const realTx = origTx(storeNames, mode);
      const origObjectStore = realTx.objectStore.bind(realTx);

      realTx.objectStore = (name: any) => {
        const store = origObjectStore(name);
        return new Proxy(store, {
          get(target, prop) {
            if (["getAll", "add", "delete", "get", "count"].includes(prop as string)) {
              return () => {
                const req: any = {};
                setTimeout(() => {
                  req.onerror?.(new Event("error"));
                }, 0);
                return req;
              };
            }
            return (target as any)[prop];
          },
        });
      };

      // Also trigger tx.onerror for write operations
      setTimeout(() => {
        realTx.onerror?.(new Event("error"));
      }, 0);

      return realTx;
    });

    localStorage.setItem("nipponic.cached_cards", JSON.stringify(mockCards));
    localStorage.setItem("nipponic.cached_decks", JSON.stringify(mockDecks));

    const cards = await getCachedCards();
    const decks = await getCachedDecks();
    const enqueueResult = await enqueueReview("c-err", 3);
    const count = await getPendingCount();
    const pending = await getPendingReviews();
    const removed = await removePendingReview(1);
    await incrementReviewAttempts(1);
    await saveCachedCards(mockCards);
    await saveCachedDecks(mockDecks);
    // Falls back to localStorage when available
    expect(cards).toEqual(mockCards);
    expect(decks).toEqual(mockDecks);
    expect(enqueueResult).toBeNull();
    expect(count).toBe(0);
    expect(pending).toEqual([]);
    expect(removed).toBe(false);

    // When localStorage is also empty
    localStorage.clear();
    const emptyCards = await getCachedCards();
    const emptyDecks = await getCachedDecks();
    expect(emptyCards).toEqual([]);
    expect(emptyDecks).toEqual([]);

    vi.restoreAllMocks();
  });

  it("should return null when enqueueReview request.result is not a number", async () => {
    const db = await (await import("./offline-db")).openOfflineDB();
    const origTx = db!.transaction.bind(db);

    vi.spyOn(db!, "transaction").mockImplementation((storeNames: any, mode: any) => {
      const realTx = origTx(storeNames, mode);
      const origObjectStore = realTx.objectStore.bind(realTx);

      realTx.objectStore = (name: any) => {
        const store = origObjectStore(name);
        if (name === "sync_queue") {
          return new Proxy(store, {
            get(target, prop) {
              if (prop === "add") {
                return () => {
                  const req: any = {};
                  setTimeout(() => {
                    req.result = "string-key-not-number";
                    req.onsuccess?.(new Event("success"));
                  }, 0);
                  return req;
                };
              }
              return (target as any)[prop];
            },
          });
        }
        return store;
      };
      return realTx;
    });

    const res = await enqueueReview("c-not-num", 3);
    expect(res).toBeNull();
    vi.restoreAllMocks();
  });
});
