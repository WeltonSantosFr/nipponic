import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import type { CreateUserDto } from './users.dto';
import type { JwtPayload } from '@nipponic/shared';

describe('UsersController', () => {
  let controller: UsersController;
  let usersServiceMock: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    usersServiceMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    controller = new UsersController(usersServiceMock as unknown as UsersService);
  });

  it('create - should call usersService.create with body and return created user', async () => {
    // Arrange
    const createUserDto: CreateUserDto = {
      username: 'sakura',
      email: 'sakura@example.com',
      password: 'password123',
    };
    const expectedUser = {
      id: 'usr_1',
      username: createUserDto.username,
      email: createUserDto.email,
    };
    usersServiceMock.create.mockResolvedValue(expectedUser);

    // Act
    const result = await controller.create(createUserDto);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(usersServiceMock.create).toHaveBeenCalledWith(createUserDto);
  });

  it('findAll - should call usersService.findAll and return list of users', async () => {
    // Arrange
    const expectedUsers = [
      { id: 'usr_1', username: 'user1', email: 'user1@example.com' },
      { id: 'usr_2', username: 'user2', email: 'user2@example.com' },
    ];
    usersServiceMock.findAll.mockResolvedValue(expectedUsers);

    // Act
    const result = await controller.findAll();

    // Assert
    expect(result).toEqual(expectedUsers);
    expect(usersServiceMock.findAll).toHaveBeenCalledTimes(1);
  });

  it('findAll - should require authentication with AuthGuard', () => {
    // Assert that AuthGuard is bound to the findAll route handler to prevent unauthorized user listing
    const guards = Reflect.getMetadata(GUARDS_METADATA, UsersController.prototype.findAll);
    expect(guards).toBeDefined();
    expect(guards).toContain(AuthGuard);
  });

  it('getMe - should call usersService.findOne with current user sub', async () => {
    // Arrange
    const mockUser: JwtPayload = {
      sub: 'usr_me',
      email: 'me@example.com',
      username: 'me',
    };
    const expectedUser = {
      id: 'usr_me',
      email: 'me@example.com',
      username: 'me',
    };
    usersServiceMock.findOne.mockResolvedValue(expectedUser);

    // Act
    const result = await controller.getMe(mockUser);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(usersServiceMock.findOne).toHaveBeenCalledWith(mockUser.sub);
  });

  it('updateMe - should call usersService.update with current user sub and body', async () => {
    // Arrange
    const mockUser: JwtPayload = {
      sub: 'usr_me',
      email: 'me@example.com',
      username: 'me',
    };
    const updateDto = { username: 'updated_me' };
    const expectedUser = {
      id: 'usr_me',
      email: 'me@example.com',
      username: 'updated_me',
    };
    usersServiceMock.update.mockResolvedValue(expectedUser);

    // Act
    const result = await controller.updateMe(mockUser, updateDto);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(usersServiceMock.update).toHaveBeenCalledWith(mockUser.sub, updateDto);
  });

  it('deleteMe - should call usersService.delete with current user sub', async () => {
    // Arrange
    const mockUser: JwtPayload = {
      sub: 'usr_me',
      email: 'me@example.com',
      username: 'me',
    };
    const deleteResult = { id: 'usr_me' };
    usersServiceMock.delete.mockResolvedValue(deleteResult);

    // Act
    const result = await controller.deleteMe(mockUser);

    // Assert
    expect(result).toEqual(deleteResult);
    expect(usersServiceMock.delete).toHaveBeenCalledWith(mockUser.sub);
  });

  it('findOne - should call usersService.findOne with param id', async () => {
    // Arrange
    const userId = 'usr_target_123';
    const expectedUser = {
      id: userId,
      email: 'target@example.com',
      username: 'targetuser',
    };
    usersServiceMock.findOne.mockResolvedValue(expectedUser);

    // Act
    const result = await controller.findOne(userId);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(usersServiceMock.findOne).toHaveBeenCalledWith(userId);
  });

  it('update - should call usersService.update with param id and body when authenticated user matches param id', async () => {
    // Arrange
    const userId = 'usr_target_123';
    const mockUser: JwtPayload = {
      sub: userId,
      email: 'target@example.com',
      username: 'target',
    };
    const updateDto = { username: 'renamed' };
    const expectedUser = {
      id: userId,
      email: 'target@example.com',
      username: 'renamed',
    };
    usersServiceMock.update.mockResolvedValue(expectedUser);

    // Act
    const result = await controller.update(userId, updateDto, mockUser);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(usersServiceMock.update).toHaveBeenCalledWith(userId, updateDto);
  });

  it('delete - should call usersService.delete with param id when authenticated user matches param id', async () => {
    // Arrange
    const userId = 'usr_target_123';
    const mockUser: JwtPayload = {
      sub: userId,
      email: 'target@example.com',
      username: 'target',
    };
    const deleteResult = { id: userId };
    usersServiceMock.delete.mockResolvedValue(deleteResult);

    // Act
    const result = await controller.delete(userId, mockUser);

    // Assert
    expect(result).toEqual(deleteResult);
    expect(usersServiceMock.delete).toHaveBeenCalledWith(userId);
  });

  it('update - should throw ForbiddenException when user attempts to update another user account (IDOR prevention)', async () => {
    // Arrange
    const currentAuthUser: JwtPayload = {
      sub: 'usr_authenticated_1',
      email: 'auth@example.com',
      username: 'authuser',
    };
    const targetUserId = 'usr_victim_2';
    const updateDto = { username: 'malicious_update' };
    usersServiceMock.update.mockResolvedValue({ id: targetUserId, ...updateDto });

    // Act & Assert
    await expect(
      Promise.resolve().then(() => controller.update(targetUserId, updateDto, currentAuthUser))
    ).rejects.toThrow(ForbiddenException);
    expect(usersServiceMock.update).not.toHaveBeenCalled();
  });

  it('delete - should throw ForbiddenException when user attempts to delete another user account (IDOR prevention)', async () => {
    // Arrange
    const currentAuthUser: JwtPayload = {
      sub: 'usr_authenticated_1',
      email: 'auth@example.com',
      username: 'authuser',
    };
    const targetUserId = 'usr_victim_2';
    const deleteResult = { id: targetUserId };
    usersServiceMock.delete.mockResolvedValue(deleteResult);

    // Act & Assert
    await expect(
      Promise.resolve().then(() => controller.delete(targetUserId, currentAuthUser))
    ).rejects.toThrow(ForbiddenException);
    expect(usersServiceMock.delete).not.toHaveBeenCalled();
  });
});
