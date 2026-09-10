import { describe, it, expect } from 'vitest';
import { applyGlossaryRules } from '../glossary';

describe('applyGlossaryRules', () => {
  it('returns jpText when rules array is empty', () => {
    const enText = 'Hello world';
    const jpText = 'こんにちは世界';
    expect(applyGlossaryRules(enText, jpText, [])).toBe(jpText);
  });

  it('returns jpText when rules are null or undefined', () => {
    const enText = 'Hello world';
    const jpText = 'こんにちは世界';
    // @ts-expect-error testing null input
    expect(applyGlossaryRules(enText, jpText, null)).toBe(jpText);
    // @ts-expect-error testing undefined input
    expect(applyGlossaryRules(enText, jpText, undefined)).toBe(jpText);
  });

  it('returns jpText when enText or jpText are empty', () => {
    const rules = [{ id: '1', sourceTerm: 'Hello', targetTerm: 'こんにちは' }];
    expect(applyGlossaryRules('', 'こんにちは世界', rules)).toBe('こんにちは世界');
    expect(applyGlossaryRules('Hello world', '', rules)).toBe('');
    expect(applyGlossaryRules('', '', rules)).toBe('');
  });

  it('skips rules with missing sourceTerm or targetTerm', () => {
    const enText = 'Hello world';
    const jpText = 'こんにちは世界';
    const rules = [
      { id: '1', sourceTerm: '', targetTerm: 'こんにちは' },
      { id: '2', sourceTerm: 'Hello', targetTerm: '' },
      // @ts-expect-error missing fields
      { id: '3' },
    ];
    expect(applyGlossaryRules(enText, jpText, rules)).toBe(jpText);
  });

  it('returns jpText when enText does not contain the sourceTerm', () => {
    const enText = 'Good morning';
    const jpText = 'Helloおはようございます';
    const rules = [{ id: '1', sourceTerm: 'Hello', targetTerm: 'こんにちは' }];
    expect(applyGlossaryRules(enText, jpText, rules)).toBe(jpText);
  });

  it('replaces sourceTerm in jpText with targetTerm when enText contains sourceTerm', () => {
    const enText = 'I use React daily';
    const jpText = '私はReactを毎日使います';
    const rules = [{ id: '1', sourceTerm: 'React', targetTerm: 'リアクト' }];
    expect(applyGlossaryRules(enText, jpText, rules)).toBe('私はリアクトを毎日使います');
  });

  it('replaces multiple occurrences of sourceTerm in jpText', () => {
    const enText = 'Apple makes the Apple Watch';
    const jpText = 'AppleはApple Watchを作っています';
    const rules = [{ id: '1', sourceTerm: 'Apple', targetTerm: 'アップル' }];
    expect(applyGlossaryRules(enText, jpText, rules)).toBe('アップルはアップル Watchを作っています');
  });

  it('skips rule when enText contains sourceTerm and jpText already contains targetTerm', () => {
    const enText = 'I use React';
    const jpText = '私はリアクト (React) を使います';
    const rules = [{ id: '1', sourceTerm: 'React', targetTerm: 'リアクト' }];
    // Since targetTerm 'リアクト' is already in jpText, it should not replace 'React'
    expect(applyGlossaryRules(enText, jpText, rules)).toBe('私はリアクト (React) を使います');
  });

  it('correctly handles regex escaping for source terms with special characters', () => {
    const enText = 'Check out this React.js framework (v18.2).';
    const jpText = 'このReact.jsフレームワーク(v18.2)をチェックしてください。';
    const rules = [
      { id: '1', sourceTerm: 'React.js', targetTerm: 'リアクト' },
      { id: '2', sourceTerm: '(v18.2)', targetTerm: 'バージョン18.2' },
    ];
    expect(applyGlossaryRules(enText, jpText, rules)).toBe('このリアクトフレームワークバージョン18.2をチェックしてください。');
  });

  it('matches source terms case-insensitively in enText and replaces them case-insensitively in jpText', () => {
    const enText = 'HELLO world';
    const jpText = 'helloワールド';
    const rules = [{ id: '1', sourceTerm: 'hello', targetTerm: 'こんにちは' }];
    expect(applyGlossaryRules(enText, jpText, rules)).toBe('こんにちはワールド');
  });
});
