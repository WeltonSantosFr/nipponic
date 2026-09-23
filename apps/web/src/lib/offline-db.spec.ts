import { describe, it, expect, beforeEach } from "vitest";
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
});
