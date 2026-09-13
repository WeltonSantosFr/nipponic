import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: { login: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    authServiceMock = {
      login: vi.fn(),
    };
    controller = new AuthController(authServiceMock as unknown as AuthService);
  });

  it('login - should call authService.login and return token response', async () => {
    // Arrange
    const loginDto = { email: 'user@example.com', password: 'password123' };
    const expectedResponse = {
      token: 'jwt_mock_token',
      user: {
        id: 'user_1',
        email: 'user@example.com',
        username: 'testuser',
      },
    };
    authServiceMock.login.mockResolvedValue(expectedResponse);

    // Act
    const result = await controller.login(loginDto);

    // Assert
    expect(result).toEqual(expectedResponse);
    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: loginDto.email,
      password: loginDto.password,
    });
  });
});
