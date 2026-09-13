import { describe, it, expect, beforeEach } from 'vitest';
import { AppController } from './app.controller';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(() => {
    controller = new AppController();
  });

  it('getRoot - should return welcome message', () => {
    // Arrange & Act
    const result = controller.getRoot();

    // Assert
    expect(result).toEqual({
      message: 'hello from create-prisma + nest',
    });
  });
});
