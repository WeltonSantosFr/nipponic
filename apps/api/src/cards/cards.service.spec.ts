import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardsService } from './cards.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CardsService', () => {
  let service: CardsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      db: {
        orm: {
          public: {
            Card: {
              create: vi.fn(),
              where: vi.fn(),
            },
          },
        },
      },
    };

    service = new CardsService(prismaMock as unknown as PrismaService);
  });

  it('create - should create a card with default values when optional fields are omitted', async () => {
    // Arrange
    const createDto = {
      jpText: '日本語',
      enText: 'Japanese language',
    };
    const userId = 'usr_123';
    const mockCreatedCard = {
      id: 'crd_1',
      jpText: '日本語',
      enText: 'Japanese language',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: null,
      lastReviewedAt: null,
      userId: 'usr_123',
    };
    prismaMock.db.orm.public.Card.create.mockResolvedValue(mockCreatedCard);

    // Act
    const result = await service.create(createDto, userId);

    // Assert
    expect(result).toEqual(mockCreatedCard);
    expect(prismaMock.db.orm.public.Card.create).toHaveBeenCalledWith({
      jpText: '日本語',
      enText: 'Japanese language',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      lapses: 0,
      nextReviewAt: null,
      lastReviewedAt: null,
      userId: 'usr_123',
    });
  });

  it('findAll - should return all cards belonging to the user', async () => {
    // Arrange
    const userId = 'usr_123';
    const mockCards = [
      { id: 'crd_1', jpText: '猫', enText: 'cat', userId },
      { id: 'crd_2', jpText: '犬', enText: 'dog', userId },
    ];
    const allMock = vi.fn().mockResolvedValue(mockCards);
    prismaMock.db.orm.public.Card.where.mockReturnValue({ all: allMock });

    // Act
    const result = await service.findAll(userId);

    // Assert
    expect(result).toEqual(mockCards);
    expect(prismaMock.db.orm.public.Card.where).toHaveBeenCalledWith({ userId });
    expect(allMock).toHaveBeenCalledTimes(1);
  });

  it('findOne - should return a single card by id and userId', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const mockCard = { id: cardId, jpText: '桜', enText: 'cherry blossom', userId };
    const firstMock = vi.fn().mockResolvedValue(mockCard);
    prismaMock.db.orm.public.Card.where.mockReturnValue({ first: firstMock });

    // Act
    const result = await service.findOne(userId, cardId);

    // Assert
    expect(result).toEqual(mockCard);
    expect(prismaMock.db.orm.public.Card.where).toHaveBeenCalledWith({ id: cardId, userId });
    expect(firstMock).toHaveBeenCalledTimes(1);
  });

  it('update - should update card fields including parsed review dates', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const nextReviewDateStr = '2026-09-10T12:00:00.000Z';
    const lastReviewedDateStr = '2026-09-08T12:00:00.000Z';
    const updateDto = {
      jpText: '新しい日本語',
      enText: 'New Japanese text',
      interval: 5,
      easeFactor: 2.6,
      repetitions: 2,
      lapses: 1,
      nextReviewAt: nextReviewDateStr,
      lastReviewedAt: lastReviewedDateStr,
    };
    const updatedCard = {
      id: cardId,
      ...updateDto,
      nextReviewAt: new Date(nextReviewDateStr),
      lastReviewedAt: new Date(lastReviewedDateStr),
      userId,
    };
    const updateMock = vi.fn().mockResolvedValue(updatedCard);
    prismaMock.db.orm.public.Card.where.mockReturnValue({ update: updateMock });

    // Act
    const result = await service.update(userId, cardId, updateDto);

    // Assert
    expect(result).toEqual(updatedCard);
    expect(prismaMock.db.orm.public.Card.where).toHaveBeenCalledWith({ id: cardId, userId });
    expect(updateMock).toHaveBeenCalledWith({
      jpText: '新しい日本語',
      enText: 'New Japanese text',
      interval: 5,
      easeFactor: 2.6,
      repetitions: 2,
      lapses: 1,
      nextReviewAt: new Date(nextReviewDateStr),
      lastReviewedAt: new Date(lastReviewedDateStr),
    });
  });

  it('delete - should delete a card by id and userId', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const deletedCard = { id: cardId, jpText: '桜', enText: 'cherry blossom', userId };
    const deleteMock = vi.fn().mockResolvedValue(deletedCard);
    prismaMock.db.orm.public.Card.where.mockReturnValue({ delete: deleteMock });

    // Act
    const result = await service.delete(userId, cardId);

    // Assert
    expect(result).toEqual(deletedCard);
    expect(prismaMock.db.orm.public.Card.where).toHaveBeenCalledWith({ id: cardId, userId });
    expect(deleteMock).toHaveBeenCalledTimes(1);
  });

  it('review - should throw NotFoundException when card does not exist', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_nonexistent';
    const firstMock = vi.fn().mockResolvedValue(null);
    prismaMock.db.orm.public.Card.where.mockReturnValue({ first: firstMock });

    // Act & Assert
    await expect(service.review(userId, cardId, 1)).rejects.toThrow(
      new NotFoundException(`Card with ID "${cardId}" not found`),
    );
    expect(prismaMock.db.orm.public.Card.where).toHaveBeenCalledWith({ id: cardId, userId });
  });

  it('review - should calculate SM-2 metrics for rating 1 (Again)', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const existingCard = {
      id: cardId,
      userId,
      easeFactor: 2.5,
      repetitions: 3,
      interval: 10,
      lapses: 1,
    };
    const firstMock = vi.fn().mockResolvedValue(existingCard);
    const updateMock = vi.fn().mockImplementation((data) => Promise.resolve({ ...existingCard, ...data }));
    prismaMock.db.orm.public.Card.where.mockReturnValue({
      first: firstMock,
      update: updateMock,
    });

    // Act
    const result = await service.review(userId, cardId, 1);

    // Assert
    expect(result.repetitions).toBe(0);
    expect(result.interval).toBe(0);
    expect(result.lapses).toBe(2);
    expect(result.easeFactor).toBe(2.3);
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    expect(result.lastReviewedAt).toBeInstanceOf(Date);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 0,
        easeFactor: 2.3,
        repetitions: 0,
        lapses: 2,
      }),
    );
  });

  it('review - should calculate SM-2 metrics for rating 2 (Hard)', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const existingCard = {
      id: cardId,
      userId,
      easeFactor: 2.5,
      repetitions: 2,
      interval: 10,
      lapses: 0,
    };
    const firstMock = vi.fn().mockResolvedValue(existingCard);
    const updateMock = vi.fn().mockImplementation((data) => Promise.resolve({ ...existingCard, ...data }));
    prismaMock.db.orm.public.Card.where.mockReturnValue({
      first: firstMock,
      update: updateMock,
    });

    // Act
    const result = await service.review(userId, cardId, 2);

    // Assert
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(12);
    expect(result.easeFactor).toBe(2.35);
    expect(result.lapses).toBe(0);
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    expect(result.lastReviewedAt).toBeInstanceOf(Date);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 12,
        easeFactor: 2.35,
        repetitions: 3,
        lapses: 0,
      }),
    );
  });

  it('review - should calculate SM-2 metrics for rating 3 (Good) with first repetition', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const existingCard = {
      id: cardId,
      userId,
      easeFactor: 2.5,
      repetitions: 0,
      interval: 0,
      lapses: 0,
    };
    const firstMock = vi.fn().mockResolvedValue(existingCard);
    const updateMock = vi.fn().mockImplementation((data) => Promise.resolve({ ...existingCard, ...data }));
    prismaMock.db.orm.public.Card.where.mockReturnValue({
      first: firstMock,
      update: updateMock,
    });

    // Act
    const result = await service.review(userId, cardId, 3);

    // Assert
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(1);
    expect(result.easeFactor).toBe(2.5);
    expect(result.lapses).toBe(0);
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    expect(result.lastReviewedAt).toBeInstanceOf(Date);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 1,
        easeFactor: 2.5,
        repetitions: 1,
        lapses: 0,
      }),
    );
  });

  it('review - should calculate SM-2 metrics for rating 4 (Easy)', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const existingCard = {
      id: cardId,
      userId,
      easeFactor: 2.5,
      repetitions: 0,
      interval: 0,
      lapses: 0,
    };
    const firstMock = vi.fn().mockResolvedValue(existingCard);
    const updateMock = vi.fn().mockImplementation((data) => Promise.resolve({ ...existingCard, ...data }));
    prismaMock.db.orm.public.Card.where.mockReturnValue({
      first: firstMock,
      update: updateMock,
    });

    // Act
    const result = await service.review(userId, cardId, 4);

    // Assert
    expect(result.repetitions).toBe(1);
    expect(result.interval).toBe(4);
    expect(result.easeFactor).toBe(2.65);
    expect(result.lapses).toBe(0);
    expect(result.nextReviewAt).toBeInstanceOf(Date);
    expect(result.lastReviewedAt).toBeInstanceOf(Date);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 4,
        easeFactor: 2.65,
        repetitions: 1,
        lapses: 0,
      }),
    );
  });

  it('review - should scale interval using ease factor for established cards (rating 3 with repetitions >= 2)', async () => {
    // Arrange
    const userId = 'usr_123';
    const cardId = 'crd_456';
    const existingCard = {
      id: cardId,
      userId,
      easeFactor: 2.5,
      repetitions: 2,
      interval: 6,
      lapses: 0,
    };
    const firstMock = vi.fn().mockResolvedValue(existingCard);
    const updateMock = vi.fn().mockImplementation((data) => Promise.resolve({ ...existingCard, ...data }));
    prismaMock.db.orm.public.Card.where.mockReturnValue({
      first: firstMock,
      update: updateMock,
    });

    // Act
    const result = await service.review(userId, cardId, 3);

    // Assert
    // newInterval = Math.round(6 * 2.5) = 15
    expect(result.repetitions).toBe(3);
    expect(result.interval).toBe(15);
    expect(result.easeFactor).toBe(2.5);
    expect(result.lapses).toBe(0);
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        interval: 15,
        easeFactor: 2.5,
        repetitions: 3,
        lapses: 0,
      }),
    );
  });
});
