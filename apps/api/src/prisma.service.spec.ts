import { describe, it, expect, vi } from 'vitest';
import { PrismaService } from './prisma.service';
import * as usersModule from './prisma/users';

vi.mock('./prisma/users', () => ({
  db: { orm: { public: {} } },
  listUsers: vi.fn(),
}));

describe('PrismaService', () => {
  it('listUsers - should call listUsers with limit and return users', async () => {
    // Arrange
    const service = new PrismaService();
    const mockUsers = [
      {
        id: '1',
        email: 'test@example.com',
        username: 'test',
        createdAt: new Date(),
      },
    ];
    vi.mocked(usersModule.listUsers).mockResolvedValue(mockUsers as any);

    // Act
    const result = await service.listUsers(5);

    // Assert
    expect(result).toEqual(mockUsers);
    expect(usersModule.listUsers).toHaveBeenCalledWith(5);
  });
});
