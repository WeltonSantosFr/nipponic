import { describe, it, expect, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { GlossaryRule } from '@nipponic/shared';
import { addGlossaryRule, applyGlossaryRules, getGlossaryRules, removeGlossaryRule, saveGlossaryRules, updateGlossaryRule, useGlossaryRules } from '../glossary';

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
    const rules: GlossaryRule[] = [
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

describe('getGlossaryRules', () => {
  it('returns empty array when localStorage has no glossary rules', () => {
    // Arrange
    localStorage.clear();

    // Act
    const rules = getGlossaryRules();

    // Assert
    expect(rules).toEqual([]);
  });

  it('returns parsed rules array when localStorage contains valid JSON', () => {
    // Arrange
    const sampleRules = [{ id: 'rule-1', sourceTerm: 'AI', targetTerm: '人工知能' }];
    localStorage.setItem('nipponic:glossary_rules_v1', JSON.stringify(sampleRules));

    // Act
    const rules = getGlossaryRules();

    // Assert
    expect(rules).toEqual(sampleRules);
  });

  it('returns empty array and logs warning when localStorage contains invalid JSON', () => {
    // Arrange
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    localStorage.setItem('nipponic:glossary_rules_v1', 'invalid-json{');

    // Act
    const rules = getGlossaryRules();

    // Assert
    expect(rules).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith('Failed to load glossary rules:', expect.any(Error));
    warnSpy.mockRestore();
  });
});

describe('saveGlossaryRules', () => {
  it('saves rules to localStorage and dispatches update event', () => {
    // Arrange
    localStorage.clear();
    const rules: GlossaryRule[] = [{ id: '1', sourceTerm: 'TypeScript', targetTerm: 'タイプスクリプト' }];
    const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

    // Act
    saveGlossaryRules(rules);

    // Assert
    expect(localStorage.getItem('nipponic:glossary_rules_v1')).toBe(JSON.stringify(rules));
    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'nipponic:glossary_updated' }));
    dispatchEventSpy.mockRestore();
  });

  it('logs a warning and does not throw when localStorage.setItem fails', () => {
    // Arrange
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    // Act & Assert
    expect(() => saveGlossaryRules([])).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith('Failed to save glossary rules:', expect.any(Error));

    setItemSpy.mockRestore();
    warnSpy.mockRestore();
  });
});

describe('addGlossaryRule', () => {
  it('creates and prepends a new rule when sourceTerm does not exist', () => {
    // Arrange
    localStorage.clear();

    // Act
    const rule = addGlossaryRule('  Docker  ', '  ドッカー  ');

    // Assert
    expect(rule.sourceTerm).toBe('Docker');
    expect(rule.targetTerm).toBe('ドッカー');
    expect(rule.id).toMatch(/^rule-/);
    const storedRules = JSON.parse(localStorage.getItem('nipponic:glossary_rules_v1') || '[]');
    expect(storedRules).toHaveLength(1);
    expect(storedRules[0]).toEqual(rule);
  });

  it('updates existing rule in place when sourceTerm matches case-insensitively', () => {
    // Arrange
    const initialRules: GlossaryRule[] = [
      { id: 'rule-docker', sourceTerm: 'docker', targetTerm: 'ドッカー' },
    ];
    localStorage.setItem('nipponic:glossary_rules_v1', JSON.stringify(initialRules));

    // Act
    const updated = addGlossaryRule('DOCKER', 'コンテナ');

    // Assert
    expect(updated.id).toBe('rule-docker');
    expect(updated.sourceTerm).toBe('DOCKER');
    expect(updated.targetTerm).toBe('コンテナ');
    const storedRules = JSON.parse(localStorage.getItem('nipponic:glossary_rules_v1') || '[]');
    expect(storedRules).toHaveLength(1);
    expect(storedRules[0]).toEqual(updated);
  });
});

describe('removeGlossaryRule', () => {
  it('removes the rule with the specified id and updates localStorage', () => {
    // Arrange
    const initialRules: GlossaryRule[] = [
      { id: 'rule-1', sourceTerm: 'React', targetTerm: 'リアクト' },
      { id: 'rule-2', sourceTerm: 'Vue', targetTerm: 'ビュー' },
    ];
    localStorage.setItem('nipponic:glossary_rules_v1', JSON.stringify(initialRules));

    // Act
    removeGlossaryRule('rule-1');

    // Assert
    const storedRules = JSON.parse(localStorage.getItem('nipponic:glossary_rules_v1') || '[]');
    expect(storedRules).toHaveLength(1);
    expect(storedRules[0].id).toBe('rule-2');
  });
});

describe('updateGlossaryRule', () => {
  it('returns null when the rule id does not exist', () => {
    // Arrange
    localStorage.clear();

    // Act
    const result = updateGlossaryRule('non-existent-id', 'source', 'target');

    // Assert
    expect(result).toBeNull();
  });

  it('updates rule and saves to localStorage when id exists', () => {
    // Arrange
    const initialRules: GlossaryRule[] = [
      { id: 'rule-update-1', sourceTerm: 'GraphQL', targetTerm: 'グラフQL' },
    ];
    localStorage.setItem('nipponic:glossary_rules_v1', JSON.stringify(initialRules));

    // Act
    const updated = updateGlossaryRule('rule-update-1', '  GraphQL API  ', '  グラフQL API  ');

    // Assert
    expect(updated).not.toBeNull();
    expect(updated?.sourceTerm).toBe('GraphQL API');
    expect(updated?.targetTerm).toBe('グラフQL API');
    const storedRules = JSON.parse(localStorage.getItem('nipponic:glossary_rules_v1') || '[]');
    expect(storedRules[0]).toEqual(updated);
  });
});

describe('useGlossaryRules', () => {
  it('initializes with rules from localStorage', () => {
    // Arrange
    const sampleRules: GlossaryRule[] = [{ id: '1', sourceTerm: 'AI', targetTerm: '人工知能' }];
    localStorage.setItem('nipponic:glossary_rules_v1', JSON.stringify(sampleRules));

    // Act
    const { result } = renderHook(() => useGlossaryRules());

    // Assert
    expect(result.current.rules).toEqual(sampleRules);
  });

  it('updates rules state when glossary update event is dispatched', () => {
    // Arrange
    localStorage.clear();
    const { result } = renderHook(() => useGlossaryRules());
    expect(result.current.rules).toEqual([]);

    const newRules: GlossaryRule[] = [{ id: '1', sourceTerm: 'CSS', targetTerm: 'スタイルシート' }];
    localStorage.setItem('nipponic:glossary_rules_v1', JSON.stringify(newRules));

    // Act
    act(() => {
      window.dispatchEvent(new Event('nipponic:glossary_updated'));
    });

    // Assert
    expect(result.current.rules).toEqual(newRules);
  });
});
