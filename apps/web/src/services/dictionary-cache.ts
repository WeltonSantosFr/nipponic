export interface DictionaryData {
  reading: string;
  meanings: string[];
  jlpt: string | null;
  isCommon: boolean;
  isCustom?: boolean;
}

const STORAGE_KEY = "nipponic:dict_cache_v1";
const CUSTOM_STORAGE_KEY = "nipponic:custom_dict_v1";
export const CUSTOM_DICT_EVENT = "nipponic:custom_dict_updated";
const MAX_LOCAL_STORAGE_ITEMS = 1000;

// 1. In-memory cache for ultra-fast synchronous lookups (<1ms)
const memoryCache = new Map<string, DictionaryData | null>();

// 2. In-memory custom user definitions map
const customDefinitions = new Map<string, DictionaryData>();

// 3. In-flight request deduplication map to prevent redundant concurrent fetches
const inFlightRequests = new Map<string, Promise<DictionaryData | null>>();

let isLocalStorageLoaded = false;

function loadLocalStorage() {
  if (typeof window === "undefined" || isLocalStorageLoaded) return;
  try {
    // Load custom user overrides first
    const customRaw = localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (customRaw) {
      const parsedCustom = JSON.parse(customRaw);
      if (typeof parsedCustom === "object" && parsedCustom !== null) {
        Object.entries(parsedCustom).forEach(([key, val]) => {
          customDefinitions.set(key, { ...(val as DictionaryData), isCustom: true });
          memoryCache.set(key, { ...(val as DictionaryData), isCustom: true });
        });
      }
    }

    // Load general cached dictionary data
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed === "object" && parsed !== null) {
        Object.entries(parsed).forEach(([key, val]) => {
          if (!customDefinitions.has(key)) {
            memoryCache.set(key, val as DictionaryData | null);
          }
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
 * Saves a user-customized definition for a Japanese word.
 */
export function saveCustomDefinition(
  word: string,
  data: {
    reading: string;
    meanings: string[];
    jlpt?: string | null;
    isCommon?: boolean;
  }
): DictionaryData {
  loadLocalStorage();

  const customData: DictionaryData = {
    reading: data.reading.trim(),
    meanings: data.meanings.filter((m) => m.trim().length > 0),
    jlpt: data.jlpt ?? null,
    isCommon: data.isCommon ?? false,
    isCustom: true,
  };

  customDefinitions.set(word, customData);
  memoryCache.set(word, customData);

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : {};
      current[word] = customData;
      localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(current));

      window.dispatchEvent(
        new CustomEvent(CUSTOM_DICT_EVENT, { detail: { word, data: customData } })
      );
    } catch (e) {
      console.warn("Failed to save custom definition to localStorage:", e);
    }
  }

  return customData;
}

/**
 * Resets a word definition back to the original dictionary (removes custom override).
 */
export function resetCustomDefinition(word: string): void {
  loadLocalStorage();
  customDefinitions.delete(word);
  memoryCache.delete(word);

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(CUSTOM_STORAGE_KEY);
      if (raw) {
        const current = JSON.parse(raw);
        delete current[word];
        localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(current));
      }

      window.dispatchEvent(
        new CustomEvent(CUSTOM_DICT_EVENT, { detail: { word, reset: true } })
      );
    } catch (e) {
      console.warn("Failed to reset custom definition:", e);
    }
  }
}

/**
 * Checks if a word has a user-customized definition.
 */
export function isCustomDefinition(word: string): boolean {
  loadLocalStorage();
  return customDefinitions.has(word);
}

/**
 * Synchronously retrieves cached dictionary data if available in memory or localStorage.
 */
export function getCachedDictionaryWord(word: string): DictionaryData | null | undefined {
  loadLocalStorage();
  if (customDefinitions.has(word)) {
    return customDefinitions.get(word);
  }
  if (memoryCache.has(word)) {
    return memoryCache.get(word);
  }
  return undefined;
}

/**
 * Fetches dictionary data for a Japanese word with multi-level caching (Custom Overrides, Memory, LocalStorage, Network).
 */
export async function fetchDictionaryWord(word: string): Promise<DictionaryData | null> {
  loadLocalStorage();

  // 1. Check custom overrides first
  if (customDefinitions.has(word)) {
    return customDefinitions.get(word)!;
  }

  // 2. Check in-memory cache
  if (memoryCache.has(word)) {
    return memoryCache.get(word) ?? null;
  }

  // 3. Deduplicate in-flight network requests
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
