import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

vi.mock('bcrypt', () => ({
  compareSync: vi.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: any;
  let jwtServiceMock: any;

  beforeEach(() => {
    prismaMock = {
      db: {
        orm: {
          public: {
            User: {
              first: vi.fn(),
            },
          },
        },
      },
    };

    jwtServiceMock = {
      signAsync: vi.fn(),
    };

    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
    );
  });

  it('login - should return an access token when credentials are valid', async () => {
    // Arrange
    const loginDto = { email: 'user@example.com', password: 'password123' };
    const mockUser = {
      id: 'usr_1',
      username: 'testuser',
      email: 'user@example.com',
      password: 'hashed_password',
    };
    prismaMock.db.orm.public.User.first.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compareSync).mockReturnValue(true as never);
    jwtServiceMock.signAsync.mockResolvedValue('jwt_token_123');

    // Act
    const result = await service.login(loginDto);

    // Assert
    expect(result).toEqual({ access_token: 'jwt_token_123' });
    expect(prismaMock.db.orm.public.User.first).toHaveBeenCalledWith({ email: loginDto.email });
    expect(bcrypt.compareSync).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    expect(jwtServiceMock.signAsync).toHaveBeenCalledWith(
      {
        sub: mockUser.id,
        username: mockUser.username,
        email: mockUser.email,
      },
      { expiresIn: '7d' },
    );
  });

  it('login - should throw UnauthorizedException when user does not exist', async () => {
    // Arrange
    const loginDto = { email: 'nonexistent@example.com', password: 'password123' };
    prismaMock.db.orm.public.User.first.mockResolvedValue(null);

    // Act & Assert
    await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    expect(prismaMock.db.orm.public.User.first).toHaveBeenCalledWith({ email: loginDto.email });
  });

  it('login - should throw UnauthorizedException when password is invalid', async () => {
    // Arrange
    const loginDto = { email: 'user@example.com', password: 'wrongPassword' };
    const mockUser = {
      id: 'usr_1',
      username: 'testuser',
      email: 'user@example.com',
      password: 'hashed_password',
    };
    prismaMock.db.orm.public.User.first.mockResolvedValue(mockUser);
    vi.mocked(bcrypt.compareSync).mockReturnValue(false as never);

    // Act & Assert
    await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    expect(prismaMock.db.orm.public.User.first).toHaveBeenCalledWith({ email: loginDto.email });
    expect(bcrypt.compareSync).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    expect(jwtServiceMock.signAsync).not.toHaveBeenCalled();
  });
});
