import { describe, it, expect, vi } from 'vitest';
import { seed } from './seed';
import * as dbModule from './db';

vi.mock('./db', () => ({
  connectDatabase: vi.fn().mockResolvedValue(undefined),
  db: {},
}));

describe('prisma/seed', () => {
  it('seed - should call connectDatabase and resolve successfully', async () => {
    // Arrange
    const connectSpy = vi.spyOn(dbModule, 'connectDatabase');

    // Act
    await seed();

    // Assert
    expect(connectSpy).toHaveBeenCalled();
  });
});
