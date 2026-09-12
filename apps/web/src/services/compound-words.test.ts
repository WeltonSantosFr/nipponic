import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  smartMergeTokens,
  getCustomCompounds,
  saveCustomCompounds,
  addCustomCompound,
  removeCustomCompound,
  useCompoundWords,
  COMPOUNDS_UPDATE_EVENT,
} from './compound-words';

const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();

describe('compound-words CRUD', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true });
    mockLocalStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCustomCompounds', () => {
    it('should return empty array when localStorage has no data', () => {
      // Arrange — localStorage is empty after beforeEach clear

      // Act
      const result = getCustomCompounds();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return parsed array from localStorage', () => {
      // Arrange
      mockLocalStorage.setItem('nipponic:custom_compounds_v1', JSON.stringify(['東京都', '大阪府']));

      // Act
      const result = getCustomCompounds();

      // Assert
      expect(result).toEqual(['東京都', '大阪府']);
    });

    it('should return empty array when stored value is not an array', () => {
      // Arrange
      mockLocalStorage.setItem('nipponic:custom_compounds_v1', JSON.stringify('not-an-array'));

      // Act
      const result = getCustomCompounds();

      // Assert
      expect(result).toEqual([]);
    });

    it('should return empty array and warn on invalid JSON', () => {
      // Arrange
      mockLocalStorage.setItem('nipponic:custom_compounds_v1', '{invalid');
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = getCustomCompounds();

      // Assert
      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('saveCustomCompounds', () => {
    it('should save compounds to localStorage and dispatch event', () => {
      // Arrange
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      // Act
      saveCustomCompounds(['北海道']);

      // Assert
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'nipponic:custom_compounds_v1',
        JSON.stringify(['北海道'])
      );
      expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: COMPOUNDS_UPDATE_EVENT }));
    });
  });

  describe('addCustomCompound', () => {
    it('should add a new compound that does not already exist', () => {
      // Arrange — empty storage
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      // Act
      addCustomCompound('東京都');

      // Assert — saved to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(dispatchSpy).toHaveBeenCalled();
    });

    it('should not add empty or single-char compounds', () => {
      // Act
      addCustomCompound('');
      addCustomCompound('X');

      // Assert — setItem never called
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });

    it('should not add a duplicate compound', () => {
      // Arrange
      mockLocalStorage.setItem('nipponic:custom_compounds_v1', JSON.stringify(['東京都']));
      // Reset the mock call count after setup
      mockLocalStorage.setItem.mockClear();

      // Act
      addCustomCompound('東京都');

      // Assert — not saved again
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('removeCustomCompound', () => {
    it('should remove an existing compound', () => {
      // Arrange
      mockLocalStorage.setItem('nipponic:custom_compounds_v1', JSON.stringify(['東京都', '大阪府']));
      mockLocalStorage.setItem.mockClear();

      // Act
      removeCustomCompound('東京都');

      // Assert — saved without the removed compound
      const savedValue = mockLocalStorage.setItem.mock.calls[0]?.[1];
      expect(JSON.parse(savedValue as string)).toEqual(['大阪府']);
    });
  });

  describe('saveCustomCompounds error handling', () => {
    it('should catch and warn on localStorage setItem failure', () => {
      // Arrange
      mockLocalStorage.setItem.mockImplementationOnce(() => { throw new Error('QuotaExceeded'); });
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      saveCustomCompounds(['東京都']);

      // Assert
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('useCompoundWords', () => {
    it('should initialize with compounds from localStorage and provide add/remove helpers', () => {
      // Arrange
      mockLocalStorage.setItem('nipponic:custom_compounds_v1', JSON.stringify(['東京都']));

      // Act
      const { result } = renderHook(() => useCompoundWords());

      // Assert
      expect(result.current.compounds).toEqual(['東京都']);
      expect(typeof result.current.addCompound).toBe('function');
      expect(typeof result.current.removeCompound).toBe('function');
    });

    it('should update compounds when a storage event is dispatched', () => {
      // Arrange
      const { result } = renderHook(() => useCompoundWords());
      expect(result.current.compounds).toEqual([]);

      // Act — simulate external storage change
      mockLocalStorage.setItem('nipponic:custom_compounds_v1', JSON.stringify(['大阪府']));
      act(() => {
        window.dispatchEvent(new Event(COMPOUNDS_UPDATE_EVENT));
      });

      // Assert
      expect(result.current.compounds).toEqual(['大阪府']);
    });
  });
});
describe('smartMergeTokens', () => {
  it('returns empty array for empty input', () => {
    expect(smartMergeTokens([], [])).toEqual([]);
    // @ts-expect-error - testing invalid input
    expect(smartMergeTokens(undefined, [])).toEqual([]);
  });

  it('does not merge tokens when customCompounds is empty', () => {
    const rawTokens = [
      { surface_form: '東京', pos: '名詞', reading: 'トウキョウ' },
      { surface_form: '都', pos: '名詞', reading: 'ト' },
    ];
    const result = smartMergeTokens(rawTokens, []);

    expect(result).toEqual([
      { surface_form: '東京', pos: '名詞', reading: 'トウキョウ', isMerged: false },
      { surface_form: '都', pos: '名詞', reading: 'ト', isMerged: false },
    ]);
  });

  it('merges multiple tokens into a single compound', () => {
    const rawTokens = [
      { surface_form: '東京', pos: '名詞', reading: 'トウキョウ' },
      { surface_form: '都', pos: '名詞', reading: 'ト' },
    ];
    const result = smartMergeTokens(rawTokens, ['東京都']);

    expect(result).toEqual([
      { surface_form: '東京都', isMerged: true },
    ]);
  });

  it('handles single token match correctly', () => {
    const rawTokens = [
      { surface_form: '東京', pos: '名詞', reading: 'トウキョウ' },
      { surface_form: '都', pos: '名詞', reading: 'ト' },
    ];
    const result = smartMergeTokens(rawTokens, ['東京']);

    expect(result).toEqual([
      { surface_form: '東京', isMerged: true },
      { surface_form: '都', pos: '名詞', reading: 'ト', isMerged: false },
    ]);
  });

  it('does not merge if compound only partially matches tokens (prefix mismatch)', () => {
    const rawTokens = [
      { surface_form: '東', pos: '名詞', reading: 'ヒガシ' },
      { surface_form: '京', pos: '名詞', reading: 'キョウ' },
    ];
    // Custom compound is '東京都', but we only have '東京' in tokens
    const result = smartMergeTokens(rawTokens, ['東京都']);

    expect(result).toEqual([
      { surface_form: '東', pos: '名詞', reading: 'ヒガシ', isMerged: false },
      { surface_form: '京', pos: '名詞', reading: 'キョウ', isMerged: false },
    ]);
  });

  it('prioritizes longest match when multiple compounds match', () => {
    const rawTokens = [
      { surface_form: '東', pos: '名詞', reading: 'ヒガシ' },
      { surface_form: '京', pos: '名詞', reading: 'キョウ' },
      { surface_form: '都', pos: '名詞', reading: 'ト' },
    ];
    // '東京' and '東京都' both start at the beginning
    const result = smartMergeTokens(rawTokens, ['東京', '東京都']);

    expect(result).toEqual([
      { surface_form: '東京都', isMerged: true },
    ]);
  });

  it('merges tokens in the middle of a sentence', () => {
    const rawTokens = [
      { surface_form: '私', pos: '名詞', reading: 'ワタシ' },
      { surface_form: 'は', pos: '助詞', reading: 'ハ' },
      { surface_form: '東', pos: '名詞', reading: 'ヒガシ' },
      { surface_form: '京', pos: '名詞', reading: 'キョウ' },
      { surface_form: 'に', pos: '助詞', reading: 'ニ' },
    ];
    const result = smartMergeTokens(rawTokens, ['東京']);

    expect(result).toEqual([
      { surface_form: '私', pos: '名詞', reading: 'ワタシ', isMerged: false },
      { surface_form: 'は', pos: '助詞', reading: 'ハ', isMerged: false },
      { surface_form: '東京', isMerged: true },
      { surface_form: 'に', pos: '助詞', reading: 'ニ', isMerged: false },
    ]);
  });
});
