import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchDictionaryWord,
  saveCustomDefinition,
  resetCustomDefinition,
  isCustomDefinition,
  getCachedDictionaryWord,
  type DictionaryData
} from './dictionary-cache';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('dictionary-cache', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    localStorageMock.clear();

    // We want to reset the cache state before each test.
    // The easiest way is to mock the module, but since we are testing it directly,
    // we'll rely on resetting any added custom words for isolation, or we could use vi.resetModules()
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchDictionaryWord', () => {
    it('returns custom definition if one exists', async () => {
      // Need to re-import dynamically if we reset modules
      const { fetchDictionaryWord, saveCustomDefinition } = await import('./dictionary-cache');

      const word = 'test-word';
      saveCustomDefinition(word, {
        reading: 'test',
        meanings: ['test meaning']
      });

      const result = await fetchDictionaryWord(word);
      expect(result).toEqual({
        reading: 'test',
        meanings: ['test meaning'],
        jlpt: null,
        isCommon: false,
        isCustom: true
      });
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('deduplicates concurrent network requests', async () => {
      const { fetchDictionaryWord } = await import('./dictionary-cache');

      const word = 'dedup-word';
      const mockData: DictionaryData = {
        reading: 'test',
        meanings: ['test'],
        jlpt: 'N5',
        isCommon: true
      };

      // Delay response to test concurrent requests
      let resolveFetch: any;
      const fetchPromise = new Promise((res) => {
        resolveFetch = res;
      });

      fetchMock.mockReturnValue(fetchPromise);

      // Fire two concurrent requests
      const req1 = fetchDictionaryWord(word);
      const req2 = fetchDictionaryWord(word);

      // Resolve fetch
      resolveFetch({
        ok: true,
        json: async () => mockData
      });

      const res1 = await req1;
      const res2 = await req2;

      expect(res1).toEqual(mockData);
      expect(res2).toEqual(mockData);

      // Fetch should only have been called once despite two concurrent requests
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('fetches data from the network and caches it', async () => {
      const { fetchDictionaryWord } = await import('./dictionary-cache');

      const word = 'network-word';
      const mockData: DictionaryData = {
        reading: 'test',
        meanings: ['test'],
        jlpt: 'N5',
        isCommon: true
      };

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData
      });

      const result = await fetchDictionaryWord(word);
      expect(result).toEqual(mockData);
      expect(fetchMock).toHaveBeenCalledWith(`/api/dictionary?word=${encodeURIComponent(word)}`);

      // Second call should return cached data (in-memory) without calling fetch
      fetchMock.mockClear();
      const result2 = await fetchDictionaryWord(word);
      expect(result2).toEqual(mockData);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns null on non-ok HTTP responses', async () => {
      const { fetchDictionaryWord } = await import('./dictionary-cache');

      const word = 'error-word';
      fetchMock.mockResolvedValueOnce({
        ok: false
      });

      const result = await fetchDictionaryWord(word);
      expect(result).toBeNull();
    });

    it('returns null on network errors', async () => {
      const { fetchDictionaryWord } = await import('./dictionary-cache');

      const word = 'network-error-word';
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const result = await fetchDictionaryWord(word);
      expect(result).toBeNull();
    });

    it('returns data from localStorage cache if available and not in memory', async () => {
       const word = 'local-storage-word';
       const mockData: DictionaryData = {
        reading: 'local',
        meanings: ['local storage data'],
        jlpt: 'N4',
        isCommon: true
      };

      // Set up local storage before importing the module so loadLocalStorage picks it up
      localStorageMock.setItem("nipponic:dict_cache_v1", JSON.stringify({
        [word]: mockData
      }));

      const { fetchDictionaryWord } = await import('./dictionary-cache');

      const result = await fetchDictionaryWord(word);

      expect(result).toEqual(mockData);
      // It should NOT call fetch because it found it in localStorage
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
