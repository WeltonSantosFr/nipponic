import { Card, Deck, ReviewRating } from "@nipponic/shared";

export interface PendingReview {
  id?: number;
  cardId: string;
  rating: ReviewRating;
  createdAt: string;
  attempts: number;
}

const DB_NAME = "nipponic_offline_v1";
const DB_VERSION = 1;

const STORES = {
  CARDS: "cards",
  DECKS: "decks",
  SYNC_QUEUE: "sync_queue",
} as const;

let dbPromise: Promise<IDBDatabase | null> | null = null;

function isIndexedDBAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

export function openOfflineDB(): Promise<IDBDatabase | null> {
  if (!isIndexedDBAvailable()) {
    return Promise.resolve(null);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(STORES.CARDS)) {
          db.createObjectStore(STORES.CARDS, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.DECKS)) {
          db.createObjectStore(STORES.DECKS, { keyPath: "id" });
        }

        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          db.createObjectStore(STORES.SYNC_QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (err) => {
        console.error("[offline-db] Failed to open IndexedDB:", err);
        resolve(null);
      };
    } catch (e) {
      console.error("[offline-db] Error accessing window.indexedDB:", e);
      resolve(null);
    }
  });

  return dbPromise;
}

// Reset cached promise (useful for tests)
export function resetDBPromise(): void {
  dbPromise = null;
}

export async function getCachedCards(): Promise<Card[]> {
  const db = await openOfflineDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.CARDS, "readonly");
      const store = tx.objectStore(STORES.CARDS);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as Card[]) || []);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function saveCachedCards(cards: Card[]): Promise<void> {
  const db = await openOfflineDB();
  if (!db || !Array.isArray(cards)) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.CARDS, "readwrite");
      const store = tx.objectStore(STORES.CARDS);

      store.clear();
      for (const card of cards) {
        store.put(card);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getCachedDecks(): Promise<Deck[]> {
  const db = await openOfflineDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.DECKS, "readonly");
      const store = tx.objectStore(STORES.DECKS);
      const request = store.getAll();

      request.onsuccess = () => resolve((request.result as Deck[]) || []);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function saveCachedDecks(decks: Deck[]): Promise<void> {
  const db = await openOfflineDB();
  if (!db || !Array.isArray(decks)) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.DECKS, "readwrite");
      const store = tx.objectStore(STORES.DECKS);

      store.clear();
      for (const deck of decks) {
        store.put(deck);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function enqueueReview(
  cardId: string,
  rating: ReviewRating
): Promise<number | null> {
  const db = await openOfflineDB();
  if (!db) return null;

  const item: Omit<PendingReview, "id"> = {
    cardId,
    rating,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SYNC_QUEUE, "readwrite");
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve(typeof request.result === "number" ? request.result : null);
      };
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  const db = await openOfflineDB();
  if (!db) return [];

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SYNC_QUEUE, "readonly");
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.getAll();

      request.onsuccess = () =>
        resolve((request.result as PendingReview[]) || []);
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function removePendingReview(id: number): Promise<boolean> {
  const db = await openOfflineDB();
  if (!db) return false;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SYNC_QUEUE, "readwrite");
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function incrementReviewAttempts(id: number): Promise<void> {
  const db = await openOfflineDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SYNC_QUEUE, "readwrite");
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        const item = getReq.result as PendingReview | undefined;
        if (item) {
          item.attempts = (item.attempts || 0) + 1;
          store.put(item);
        }
        resolve();
      };
      getReq.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function clearPendingReviews(): Promise<void> {
  const db = await openOfflineDB();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SYNC_QUEUE, "readwrite");
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getPendingCount(): Promise<number> {
  const db = await openOfflineDB();
  if (!db) return 0;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORES.SYNC_QUEUE, "readonly");
      const store = tx.objectStore(STORES.SYNC_QUEUE);
      const countReq = store.count();

      countReq.onsuccess = () => resolve(countReq.result || 0);
      countReq.onerror = () => resolve(0);
    } catch {
      resolve(0);
    }
  });
}
