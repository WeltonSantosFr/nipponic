import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
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

  it('update - should call usersService.update with param id and body', async () => {
    // Arrange
    const userId = 'usr_target_123';
    const updateDto = { username: 'renamed' };
    const expectedUser = {
      id: userId,
      email: 'target@example.com',
      username: 'renamed',
    };
    usersServiceMock.update.mockResolvedValue(expectedUser);

    // Act
    const result = await controller.update(userId, updateDto);

    // Assert
    expect(result).toEqual(expectedUser);
    expect(usersServiceMock.update).toHaveBeenCalledWith(userId, updateDto);
  });

  it('delete - should call usersService.delete with param id', async () => {
    // Arrange
    const userId = 'usr_target_123';
    const deleteResult = { id: userId };
    usersServiceMock.delete.mockResolvedValue(deleteResult);

    // Act
    const result = await controller.delete(userId);

    // Assert
    expect(result).toEqual(deleteResult);
    expect(usersServiceMock.delete).toHaveBeenCalledWith(userId);
  });
});
