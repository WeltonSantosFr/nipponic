import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthGuard } from './auth.guard';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtServiceMock: any;
  let executionContextMock: any;
  let requestMock: any;

  beforeEach(() => {
    jwtServiceMock = {
      verifyAsync: vi.fn(),
    };

    requestMock = {
      headers: {},
    };

    executionContextMock = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(requestMock),
      }),
    };

    authGuard = new AuthGuard(jwtServiceMock as unknown as JwtService);
  });

  it('should return true and set user on request when token is valid', async () => {
    // Arrange
    requestMock.headers.authorization = 'Bearer valid_token';
    const mockPayload = { id: 1, username: 'testuser' };
    jwtServiceMock.verifyAsync.mockResolvedValue(mockPayload);

    // Act
    const result = await authGuard.canActivate(executionContextMock as unknown as ExecutionContext);

    // Assert
    expect(result).toBe(true);
    expect(requestMock['user']).toEqual(mockPayload);
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('valid_token');
  });

  it('should throw UnauthorizedException when token is not provided', async () => {
    // Arrange
    requestMock.headers.authorization = undefined;

    // Act & Assert
    await expect(authGuard.canActivate(executionContextMock as unknown as ExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Token not provided'),
    );
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when authorization type is not Bearer', async () => {
    // Arrange
    requestMock.headers.authorization = 'Basic token123';

    // Act & Assert
    await expect(authGuard.canActivate(executionContextMock as unknown as ExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Token not provided'),
    );
    expect(jwtServiceMock.verifyAsync).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException when token is invalid or expired', async () => {
    // Arrange
    requestMock.headers.authorization = 'Bearer invalid_token';
    jwtServiceMock.verifyAsync.mockRejectedValue(new Error('Invalid token'));

    // Act & Assert
    await expect(authGuard.canActivate(executionContextMock as unknown as ExecutionContext)).rejects.toThrow(
      new UnauthorizedException('Invalid or expired token'),
    );
    expect(jwtServiceMock.verifyAsync).toHaveBeenCalledWith('invalid_token');
  });
});
