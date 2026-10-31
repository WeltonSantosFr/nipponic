import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { Logger } from '@nestjs/common';

vi.mock('bcrypt', () => ({
  hashSync: vi.fn((pwd: string) => `hashed_${pwd}`),
  compareSync: vi.fn((pwd: string, hash: string) => hash === `hashed_${pwd}`),
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
    expect(result).toEqual({ id: createdUser.id, username: createdUser.username, email: createdUser.email });
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
    const updateDto = { username: 'kenji', password: 'newPassword456', currentPassword: 'oldPassword123' };
    prismaMock.db.orm.public.User.first.mockResolvedValue({ id: 'usr_123', password: 'hashed_oldPassword123' });
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
    expect(result).toEqual({ id: 'usr_123', username: 'kenji', email: 'kenji@nipponic.com' });
    expect(result).not.toHaveProperty('password');
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

  it('delete - should log error and continue deleting user when deleting notes fails', async () => {
    // Arrange
    const loggerErrorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const noteError = new Error('Database connection failure');
    const noteDeleteMock = vi.fn().mockRejectedValue(noteError);
    prismaMock.db.orm.public.Note.where.mockReturnValue({ delete: noteDeleteMock });

    const userDeleteMock = vi.fn().mockResolvedValue({ id: 'usr_123' });
    prismaMock.db.orm.public.User.where.mockReturnValue({ delete: userDeleteMock });

    // Act
    const result = await service.delete('usr_123');

    // Assert
    expect(result).toEqual({ id: 'usr_123' });
    expect(loggerErrorSpy).toHaveBeenCalledWith('Failed to delete notes for user usr_123', noteError);
    expect(prismaMock.db.orm.public.User.where).toHaveBeenCalledWith({ id: 'usr_123' });
    expect(userDeleteMock).toHaveBeenCalledTimes(1);
    loggerErrorSpy.mockRestore();
  });

  describe('security regressions', () => {
    it('findOne - never returns the password hash', async () => {
      prismaMock.db.orm.public.User.first.mockResolvedValue({
        id: 'usr_1', username: 'a', email: 'a@b.c', password: 'hashed_secret', githubUsername: null,
      });
      const result = await service.findOne('usr_1');
      expect(result).not.toHaveProperty('password');
    });

    it('findOne - never returns the password hash for supporters either', async () => {
      prismaMock.db.orm.public.Sponsor = { first: vi.fn().mockResolvedValue({ isActive: true, tierName: 'Bento Box' }) };
      prismaMock.db.orm.public.User.first.mockResolvedValue({
        id: 'usr_1', username: 'a', email: 'a@b.c', password: 'hashed_secret', githubUsername: 'gh',
      });
      const result = await service.findOne('usr_1');
      expect(result).not.toHaveProperty('password');
      expect(result).toMatchObject({ isSupporter: true });
    });

    it('create - never returns the password hash', async () => {
      prismaMock.db.orm.public.User.first.mockResolvedValue(null);
      prismaMock.db.orm.public.User.create.mockResolvedValue({
        id: 'usr_1', username: 'a', email: 'a@b.c', password: 'hashed_secret',
      });
      const result = await service.create({ username: 'a', email: 'a@b.c', password: 'secret1' });
      expect(result).not.toHaveProperty('password');
    });

    it('update - requires current password to change password', async () => {
      await expect(service.update('usr_1', { password: 'newSecret1' })).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.db.orm.public.User.where).not.toHaveBeenCalled();
    });

    it('update - rejects an incorrect current password', async () => {
      prismaMock.db.orm.public.User.first.mockResolvedValue({ id: 'usr_1', password: 'hashed_real' });
      await expect(
        service.update('usr_1', { password: 'newSecret1', currentPassword: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prismaMock.db.orm.public.User.where).not.toHaveBeenCalled();
    });

    it('update - never persists currentPassword', async () => {
      const updateMock = vi.fn().mockResolvedValue({ id: 'usr_1', username: 'x', password: 'h' });
      prismaMock.db.orm.public.User.where.mockReturnValue({ update: updateMock });
      await service.update('usr_1', { username: 'x', currentPassword: 'whatever' });
      expect(updateMock).toHaveBeenCalledWith({ username: 'x' });
    });

    it('does not expose findAll', () => {
      expect((service as unknown as Record<string, unknown>).findAll).toBeUndefined();
    });
  });
});
