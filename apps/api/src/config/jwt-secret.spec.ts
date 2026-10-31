import { describe, it, expect } from 'vitest';
import { resolveJwtSecret } from './jwt-secret';

describe('resolveJwtSecret', () => {
  const strong = 'x'.repeat(40);

  it('throws in production when JWT_SECRET is missing (no hardcoded fallback)', () => {
    expect(() => resolveJwtSecret({ NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow(/JWT_SECRET/);
  });

  it('throws when NODE_ENV is unset and JWT_SECRET is missing', () => {
    expect(() => resolveJwtSecret({} as NodeJS.ProcessEnv)).toThrow(/JWT_SECRET/);
  });

  it('throws in production when the secret is too short', () => {
    expect(() => resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: 'short' } as NodeJS.ProcessEnv)).toThrow(/32/);
  });

  it('returns the configured secret when strong', () => {
    expect(resolveJwtSecret({ NODE_ENV: 'production', JWT_SECRET: strong } as NodeJS.ProcessEnv)).toBe(strong);
  });

  it('uses a random ephemeral secret in development, never the old hardcoded one', () => {
    const a = resolveJwtSecret({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
    const b = resolveJwtSecret({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
    expect(a).not.toBe('nipponic-jwt-secret-dev-2026-key');
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThanOrEqual(32);
  });
});
