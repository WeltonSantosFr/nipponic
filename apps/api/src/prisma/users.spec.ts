import { describe, it, expect, vi } from 'vitest';
import { listUsers } from './users';
import { seed } from './seed';
import { db } from './db';

vi.mock('./seed', () => ({
  seed: vi.fn(),
}));

vi.mock('./db', () => ({
  db: {
    orm: {
      public: {
        User: {
          select: vi.fn(),
        },
      },
    },
  },
}));

describe('prisma/users', () => {
  it('listUsers - should call seed and return mapped users', async () => {
    // Arrange
    const mockUsers = [
      {
        id: 1,
        email: 'user1@example.com',
        username: 'user1',
        createdAt: new Date('2026-01-01'),
      },
      {
        id: 2,
        email: 'user2@example.com',
        username: undefined,
        createdAt: new Date('2026-01-02'),
      },
    ];

    const allMock = vi.fn().mockResolvedValue(mockUsers);
    const takeMock = vi.fn().mockReturnValue({ all: allMock });
    const selectMock = vi.fn().mockReturnValue({ take: takeMock });
    (db.orm.public.User.select as any) = selectMock;

    // Act
    const result = await listUsers(5);

    // Assert
    expect(seed).toHaveBeenCalled();
    expect(selectMock).toHaveBeenCalledWith('id', 'email', 'username', 'createdAt');
    expect(takeMock).toHaveBeenCalledWith(5);
    expect(result).toEqual([
      {
        id: '1',
        email: 'user1@example.com',
        username: 'user1',
        createdAt: mockUsers[0].createdAt,
      },
      {
        id: '2',
        email: 'user2@example.com',
        username: null,
        createdAt: mockUsers[1].createdAt,
      },
    ]);
  });
});
