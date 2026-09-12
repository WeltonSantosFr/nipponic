import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';

vi.mock('bcrypt', () => ({
  hashSync: vi.fn((pwd: string) => `hashed_${pwd}`),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      db: {
        orm: {
          public: {
            User: {
              all: vi.fn(),
              first: vi.fn(),
              create: vi.fn(),
              where: vi.fn(),
            },
            Note: {
              where: vi.fn(),
            },
          },
        },
      },
    };

    service = new UsersService(prismaMock as unknown as PrismaService);
  });

  it('findAll - should return a list of users', async () => {
    // Arrange
    const mockUsers = [
      { id: '1', username: 'user1', email: 'user1@example.com' },
      { id: '2', username: 'user2', email: 'user2@example.com' },
    ];
    prismaMock.db.orm.public.User.all.mockResolvedValue(mockUsers);

    // Act
    const result = await service.findAll();

    // Assert
    expect(result).toEqual(mockUsers);
    expect(prismaMock.db.orm.public.User.all).toHaveBeenCalledTimes(1);
  });

  it('findOne - should return a user by id', async () => {
    // Arrange
    const mockUser = { id: 'usr_123', username: 'tanaka', email: 'tanaka@nipponic.com' };
    prismaMock.db.orm.public.User.first.mockResolvedValue(mockUser);

    // Act
    const result = await service.findOne('usr_123');

    // Assert
    expect(result).toEqual(mockUser);
    expect(prismaMock.db.orm.public.User.first).toHaveBeenCalledWith({ id: 'usr_123' });
  });

  it('create - should hash password and create a new user', async () => {
    // Arrange
    const createUserDto = {
      username: 'sakura',
      email: 'sakura@nipponic.com',
      password: 'plainPassword123',
    };
    const createdUser = {
      id: 'usr_456',
      username: 'sakura',
      email: 'sakura@nipponic.com',
      password: 'hashed_plainPassword123',
    };
    prismaMock.db.orm.public.User.create.mockResolvedValue(createdUser);

    // Act
    const result = await service.create(createUserDto);

    // Assert
    expect(result).toEqual(createdUser);
    expect(prismaMock.db.orm.public.User.create).toHaveBeenCalledWith({
      username: createUserDto.username,
      email: createUserDto.email,
      password: 'hashed_plainPassword123',
    });
  });

  it('create - should throw ConflictException if user already exists', async () => {
    // Arrange
    const createUserDto = {
      username: 'sakura',
      email: 'sakura@nipponic.com',
      password: 'plainPassword123',
    };
    prismaMock.db.orm.public.User.first.mockResolvedValue({ id: 'existing_id' });

    // Act & Assert
    await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
    expect(prismaMock.db.orm.public.User.create).not.toHaveBeenCalled();
  });

  it('update - should update user and re-hash password if password is provided', async () => {
    // Arrange
    const updateDto = { username: 'kenji', password: 'newPassword456' };
    const updatedUser = {
      id: 'usr_123',
      username: 'kenji',
      email: 'kenji@nipponic.com',
      password: 'hashed_newPassword456',
    };
    const updateMock = vi.fn().mockResolvedValue(updatedUser);
    prismaMock.db.orm.public.User.where.mockReturnValue({ update: updateMock });

    // Act
    const result = await service.update('usr_123', updateDto);

    // Assert
    expect(result).toEqual(updatedUser);
    expect(prismaMock.db.orm.public.User.where).toHaveBeenCalledWith({ id: 'usr_123' });
    expect(updateMock).toHaveBeenCalledWith({
      username: 'kenji',
      password: 'hashed_newPassword456',
    });
  });

  it('update - should update user without re-hashing if password is not provided', async () => {
    // Arrange
    const updateDto = { username: 'kenji_updated' };
    const updatedUser = {
      id: 'usr_123',
      username: 'kenji_updated',
      email: 'kenji@nipponic.com',
    };
    const updateMock = vi.fn().mockResolvedValue(updatedUser);
    prismaMock.db.orm.public.User.where.mockReturnValue({ update: updateMock });

    // Act
    const result = await service.update('usr_123', updateDto);

    // Assert
    expect(result).toEqual(updatedUser);
    expect(prismaMock.db.orm.public.User.where).toHaveBeenCalledWith({ id: 'usr_123' });
    expect(updateMock).toHaveBeenCalledWith({
      username: 'kenji_updated',
    });
  });

  it('delete - should delete user notes and then delete user', async () => {
    // Arrange
    const noteDeleteMock = vi.fn().mockResolvedValue({ count: 1 });
    prismaMock.db.orm.public.Note.where.mockReturnValue({ delete: noteDeleteMock });

    const userDeleteMock = vi.fn().mockResolvedValue({ id: 'usr_123' });
    prismaMock.db.orm.public.User.where.mockReturnValue({ delete: userDeleteMock });

    // Act
    const result = await service.delete('usr_123');

    // Assert
    expect(result).toEqual({ id: 'usr_123' });
    expect(prismaMock.db.orm.public.Note.where).toHaveBeenCalledWith({ userId: 'usr_123' });
    expect(noteDeleteMock).toHaveBeenCalledTimes(1);
    expect(prismaMock.db.orm.public.User.where).toHaveBeenCalledWith({ id: 'usr_123' });
    expect(userDeleteMock).toHaveBeenCalledTimes(1);
  });
});
