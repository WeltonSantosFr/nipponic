import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecksController } from './decks.controller';
import { DecksService } from './decks.service';
import type { CreateDeckDto, UpdateDeckDto } from './decks.dto';
import type { JwtPayload } from '@nipponic/shared';

describe('DecksController', () => {
  let controller: DecksController;
  let decksServiceMock: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findPublic: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    addCards: ReturnType<typeof vi.fn>;
    removeCard: ReturnType<typeof vi.fn>;
    reorderCards: ReturnType<typeof vi.fn>;
  };

  const mockUser: JwtPayload = {
    sub: 'user_123',
    email: 'user@example.com',
    username: 'testuser',
  };

  beforeEach(() => {
    decksServiceMock = {
      create: vi.fn(),
      findAll: vi.fn(),
      findPublic: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      addCards: vi.fn(),
      removeCard: vi.fn(),
      reorderCards: vi.fn(),
    };
    controller = new DecksController(decksServiceMock as unknown as DecksService);
  });

  it('create - should call decksService.create with deck and user sub', async () => {
    // Arrange
    const createDeckDto: CreateDeckDto = {
      name: 'JLPT N5 Vocabulary',
      isPublic: true,
    };
    const expectedDeck = {
      id: 'deck_1',
      ...createDeckDto,
      userId: mockUser.sub,
    };
    decksServiceMock.create.mockResolvedValue(expectedDeck);

    // Act
    const result = await controller.create(createDeckDto, mockUser);

    // Assert
    expect(result).toEqual(expectedDeck);
    expect(decksServiceMock.create).toHaveBeenCalledWith(createDeckDto, mockUser.sub);
  });

  it('findAll - should call decksService.findAll with user sub and return user decks', async () => {
    // Arrange
    const expectedDecks = [
      { id: 'deck_1', name: 'Deck 1', userId: mockUser.sub },
      { id: 'deck_2', name: 'Deck 2', userId: mockUser.sub },
    ];
    decksServiceMock.findAll.mockResolvedValue(expectedDecks);

    // Act
    const result = await controller.findAll(mockUser);

    // Assert
    expect(result).toEqual(expectedDecks);
    expect(decksServiceMock.findAll).toHaveBeenCalledWith(mockUser.sub);
  });

  it('findPublic - should call decksService.findPublic with user sub and return public decks', async () => {
    // Arrange
    const expectedPublicDecks = [
      { id: 'deck_pub_1', name: 'Public Deck', isPublic: true },
    ];
    decksServiceMock.findPublic.mockResolvedValue(expectedPublicDecks);

    // Act
    const result = await controller.findPublic(mockUser);

    // Assert
    expect(result).toEqual(expectedPublicDecks);
    expect(decksServiceMock.findPublic).toHaveBeenCalledWith(mockUser.sub);
  });

  it('findOne - should call decksService.findOne with user sub and deck id', async () => {
    // Arrange
    const deckId = 'deck_123';
    const expectedDeck = {
      id: deckId,
      name: 'Vocabulary Deck',
      userId: mockUser.sub,
    };
    decksServiceMock.findOne.mockResolvedValue(expectedDeck);

    // Act
    const result = await controller.findOne(mockUser, deckId);

    // Assert
    expect(result).toEqual(expectedDeck);
    expect(decksServiceMock.findOne).toHaveBeenCalledWith(mockUser.sub, deckId);
  });

  it('update - should call decksService.update with user sub, deck id, and update dto', async () => {
    // Arrange
    const deckId = 'deck_123';
    const updateDeckDto: UpdateDeckDto = {
      name: 'Updated Deck Name',
      isPublic: false,
    };
    const expectedDeck = {
      id: deckId,
      ...updateDeckDto,
      userId: mockUser.sub,
    };
    decksServiceMock.update.mockResolvedValue(expectedDeck);

    // Act
    const result = await controller.update(mockUser, deckId, updateDeckDto);

    // Assert
    expect(result).toEqual(expectedDeck);
    expect(decksServiceMock.update).toHaveBeenCalledWith(mockUser.sub, deckId, updateDeckDto);
  });
});
