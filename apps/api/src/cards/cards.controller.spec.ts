import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import type { CreateCardDto, UpdateCardDto, ReviewCardDto } from './cards.dto';
import type { JwtPayload } from '@nipponic/shared';

describe('CardsController', () => {
  let controller: CardsController;
  let cardsServiceMock: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    review: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };

  const mockUser: JwtPayload = {
    sub: 'user_123',
    email: 'user@example.com',
    username: 'testuser',
  };

  beforeEach(() => {
    cardsServiceMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      review: vi.fn(),
      delete: vi.fn(),
    };
    controller = new CardsController(cardsServiceMock as unknown as CardsService);
  });

  it('create - should call cardsService.create with card and user sub', async () => {
    // Arrange
    const createCardDto: CreateCardDto = {
      jpText: '猫',
      enText: 'cat',
    };
    const expectedCard = {
      id: 'card_1',
      ...createCardDto,
      userId: mockUser.sub,
    };
    cardsServiceMock.create.mockResolvedValue(expectedCard);

    // Act
    const result = await controller.create(createCardDto, mockUser);

    // Assert
    expect(result).toEqual(expectedCard);
    expect(cardsServiceMock.create).toHaveBeenCalledWith(createCardDto, mockUser.sub);
  });

  it('findAll - should call cardsService.findAll with user sub and return user cards', async () => {
    // Arrange
    const expectedCards = [
      { id: 'card_1', jpText: '猫', enText: 'cat', userId: mockUser.sub },
      { id: 'card_2', jpText: '犬', enText: 'dog', userId: mockUser.sub },
    ];
    cardsServiceMock.findAll.mockResolvedValue(expectedCards);

    // Act
    const result = await controller.findAll(mockUser);

    // Assert
    expect(result).toEqual(expectedCards);
    expect(cardsServiceMock.findAll).toHaveBeenCalledWith(mockUser.sub);
  });

  it('findOne - should call cardsService.findOne with user sub and card id', async () => {
    // Arrange
    const cardId = 'card_123';
    const expectedCard = {
      id: cardId,
      jpText: '桜',
      enText: 'cherry blossom',
      userId: mockUser.sub,
    };
    cardsServiceMock.findOne.mockResolvedValue(expectedCard);

    // Act
    const result = await controller.findOne(mockUser, cardId);

    // Assert
    expect(result).toEqual(expectedCard);
    expect(cardsServiceMock.findOne).toHaveBeenCalledWith(mockUser.sub, cardId);
  });

  it('update - should call cardsService.update with user sub, card id, and update payload', async () => {
    // Arrange
    const cardId = 'card_123';
    const updateCardDto: UpdateCardDto = {
      jpText: '桜 (さくら)',
    };
    const expectedCard = {
      id: cardId,
      jpText: '桜 (さくら)',
      enText: 'cherry blossom',
      userId: mockUser.sub,
    };
    cardsServiceMock.update.mockResolvedValue(expectedCard);

    // Act
    const result = await controller.update(mockUser, cardId, updateCardDto);

    // Assert
    expect(result).toEqual(expectedCard);
    expect(cardsServiceMock.update).toHaveBeenCalledWith(mockUser.sub, cardId, updateCardDto);
  });

  it('review - should call cardsService.review with user sub, card id, and rating', async () => {
    // Arrange
    const cardId = 'card_123';
    const reviewDto: ReviewCardDto = {
      rating: 3,
    };
    const expectedResult = {
      id: cardId,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
    };
    cardsServiceMock.review.mockResolvedValue(expectedResult);

    // Act
    const result = await controller.review(mockUser, cardId, reviewDto);

    // Assert
    expect(result).toEqual(expectedResult);
    expect(cardsServiceMock.review).toHaveBeenCalledWith(mockUser.sub, cardId, reviewDto.rating);
  });

  it('delete - should call cardsService.delete with user sub and card id', async () => {
    // Arrange
    const cardId = 'card_123';
    const deleteResult = { id: cardId };
    cardsServiceMock.delete.mockResolvedValue(deleteResult);

    // Act
    const result = await controller.delete(mockUser, cardId);

    // Assert
    expect(result).toEqual(deleteResult);
    expect(cardsServiceMock.delete).toHaveBeenCalledWith(mockUser.sub, cardId);
  });
});
