import { describe, it, expect } from 'vitest';
import { type ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { CurrentUser } from './current-user.decorator';

function getParamDecoratorFactory(decorator: Function) {
  class TestClass {
    testMethod(@decorator() _value: any) {}
  }
  const args = Reflect.getMetadata(ROUTE_ARGS_METADATA, TestClass, 'testMethod');
  return args[Object.keys(args)[0]].factory;
}

describe('CurrentUser decorator', () => {
  it('should extract user from execution context request', () => {
    // Arrange
    const factory = getParamDecoratorFactory(CurrentUser);
    const mockUser = { sub: 'user_123', email: 'test@example.com' };
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ user: mockUser }),
      }),
    } as unknown as ExecutionContext;

    // Act
    const result = factory(null, mockContext);

    // Assert
    expect(result).toEqual(mockUser);
  });
});
