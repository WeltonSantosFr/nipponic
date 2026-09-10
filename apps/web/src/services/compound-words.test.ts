import { describe, it, expect } from 'vitest';
import { smartMergeTokens } from './compound-words';

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
