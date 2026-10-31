import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GUARDS_METADATA, PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '../auth/auth.guard';
import type { CreateUserDto } from './users.dto';
import type { JwtPayload } from '@nipponic/shared';

describe('UsersController', () => {
  let controller: UsersController;
  let usersServiceMock: {
    create: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  const currentUser = { sub: 'usr_1', username: 'sakura', email: 's@example.com' } as JwtPayload;

  beforeEach(() => {
    usersServiceMock = {
      create: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    controller = new UsersController(usersServiceMock as unknown as UsersService);
  });

  it('create - should call usersService.create with body and return created user', async () => {
    const dto: CreateUserDto = { username: 'sakura', email: 'sakura@example.com', password: 'password123' };
    const expected = { id: 'usr_1', username: dto.username, email: dto.email };
    usersServiceMock.create.mockResolvedValue(expected);

    expect(await controller.create(dto)).toEqual(expected);
    expect(usersServiceMock.create).toHaveBeenCalledWith(dto);
  });

  it('getMe - should call usersService.findOne with current user sub', async () => {
    usersServiceMock.findOne.mockResolvedValue({ id: 'usr_1' });
    expect(await controller.getMe(currentUser)).toEqual({ id: 'usr_1' });
    expect(usersServiceMock.findOne).toHaveBeenCalledWith('usr_1');
  });

  it('updateMe - should call usersService.update with current user sub and body', async () => {
    usersServiceMock.update.mockResolvedValue({ id: 'usr_1', username: 'new' });
    await controller.updateMe(currentUser, { username: 'new' });
    expect(usersServiceMock.update).toHaveBeenCalledWith('usr_1', { username: 'new' });
  });

  it('deleteMe - should call usersService.delete with current user sub', async () => {
    usersServiceMock.delete.mockResolvedValue({ id: 'usr_1' });
    await controller.deleteMe(currentUser);
    expect(usersServiceMock.delete).toHaveBeenCalledWith('usr_1');
  });

  it.each(['getMe', 'updateMe', 'deleteMe'] as const)('%s - should require AuthGuard', (method) => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, UsersController.prototype[method]);
    expect(guards).toContain(AuthGuard);
  });

  describe('security regressions', () => {
    it('does not expose user listing or id-addressed routes (no cross-user access)', () => {
      const proto = UsersController.prototype as unknown as Record<string, unknown>;
      for (const removed of ['findAll', 'findOne', 'update', 'delete']) {
        expect(proto[removed]).toBeUndefined();
      }
    });

    it('only exposes the expected routes', () => {
      const routes = Object.getOwnPropertyNames(UsersController.prototype)
        .filter((n) => n !== 'constructor')
        .map((n) => {
          const fn = (UsersController.prototype as unknown as Record<string, object>)[n];
          return `${Reflect.getMetadata(METHOD_METADATA, fn)}:${Reflect.getMetadata(PATH_METADATA, fn)}`;
        })
        .sort();
      // RequestMethod: GET=0, POST=1, DELETE=3, PATCH=4
      expect(routes).toEqual(['0:me', '1:/', '3:me', '4:me']);
    });
  });
});
