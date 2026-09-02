export interface DictionaryData {
  reading: string;
  meanings: string[];
  jlpt: string | null;
  isCommon: boolean;
}

const STORAGE_KEY = "nipponic:dict_cache_v1";
const MAX_LOCAL_STORAGE_ITEMS = 1000;

// 1. In-memory cache for ultra-fast synchronous lookups (<1ms)
const memoryCache = new Map<string, DictionaryData | null>();

// 2. In-flight request deduplication map to prevent redundant concurrent fetches
const inFlightRequests = new Map<string, Promise<DictionaryData | null>>();

let isLocalStorageLoaded = false;

function loadLocalStorage() {
  if (typeof window === "undefined" || isLocalStorageLoaded) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        Object.entries(parsed).forEach(([key, val]) => {
          memoryCache.set(key, val as DictionaryData | null);
        });
      }
    }
  } catch (error) {
    console.warn("Failed to load dictionary cache from localStorage:", error);
  } finally {
    isLocalStorageLoaded = true;
  }
}

function persistToLocalStorage(word: string, data: DictionaryData | null) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const current: Record<string, DictionaryData | null> = raw ? JSON.parse(raw) : {};
    current[word] = data;

    const keys = Object.keys(current);
    if (keys.length > MAX_LOCAL_STORAGE_ITEMS && keys[0]) {
      // Remove the oldest key if limit exceeded
      delete current[keys[0]];
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch (error) {
    console.warn("Failed to save dictionary word to localStorage:", error);
  }
}

/**
 * Synchronously retrieves cached dictionary data if available in memory or localStorage.
 */
export function getCachedDictionaryWord(word: string): DictionaryData | null | undefined {
  loadLocalStorage();
  if (memoryCache.has(word)) {
    return memoryCache.get(word);
  }
  return undefined;
}

/**
 * Fetches dictionary data for a Japanese word with multi-level caching (Memory, LocalStorage, Network).
 */
export async function fetchDictionaryWord(word: string): Promise<DictionaryData | null> {
  loadLocalStorage();

  // Check in-memory cache first
  if (memoryCache.has(word)) {
    return memoryCache.get(word) ?? null;
  }

  // Deduplicate in-flight network requests
  if (inFlightRequests.has(word)) {
    return inFlightRequests.get(word)!;
  }

  const requestPromise = (async () => {
    try {
      const res = await fetch(`/api/dictionary?word=${encodeURIComponent(word)}`);
      if (!res.ok) {
        return null;
      }

      const data: DictionaryData = await res.json();
      memoryCache.set(word, data);
      persistToLocalStorage(word, data);
      return data;
    } catch (error) {
      console.error("Error fetching dictionary word:", error);
      return null;
    } finally {
      inFlightRequests.delete(word);
    }
  })();

  inFlightRequests.set(word, requestPromise);
  return requestPromise;
}
