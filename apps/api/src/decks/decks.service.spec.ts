import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DecksService } from './decks.service';
import { PrismaService } from '../prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('DecksService', () => {
  let service: DecksService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      db: {
        orm: {
          public: {
            Deck: {
              create: vi.fn(),
              where: vi.fn(),
            },
            DeckCard: {
              create: vi.fn(),
              where: vi.fn(),
            },
            Card: {
              where: vi.fn(),
            },
          },
        },
      },
    };

    service = new DecksService(prismaMock as unknown as PrismaService);
  });

  const setupPopulateMocks = (deckCards: any[], userCards: any[]) => {
    const deckCardWhereMock = vi.fn().mockReturnValue({
      all: vi.fn().mockResolvedValue(deckCards),
    });
    const cardWhereMock = vi.fn().mockReturnValue({
      all: vi.fn().mockResolvedValue(userCards),
    });
    prismaMock.db.orm.public.DeckCard.where = deckCardWhereMock;
    prismaMock.db.orm.public.Card.where = cardWhereMock;
  };

  describe('create', () => {
    it('should create a deck, add cards, and populate', async () => {
      const createDto = {
        name: 'My Deck',
        isPublic: true,
        cardIds: ['card_1', 'card_2'],
      };
      const userId = 'user_1';
      const createdDeck = {
        id: 'deck_1',
        name: 'My Deck',
        isPublic: true,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.db.orm.public.Deck.create.mockResolvedValue(createdDeck);
      prismaMock.db.orm.public.DeckCard.create.mockResolvedValue({});

      const deckCards = [
        { id: 'dc_1', deckId: 'deck_1', cardId: 'card_1', order: 0 },
        { id: 'dc_2', deckId: 'deck_1', cardId: 'card_2', order: 1 },
      ];
      const userCards = [
        { id: 'card_1', jpText: 'a', userId },
        { id: 'card_2', jpText: 'b', userId },
      ];

      setupPopulateMocks(deckCards, userCards);

      const result = await service.create(createDto, userId);

      expect(prismaMock.db.orm.public.Deck.create).toHaveBeenCalledWith({
        name: 'My Deck',
        isPublic: true,
        userId,
      });
      expect(prismaMock.db.orm.public.DeckCard.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.db.orm.public.DeckCard.create).toHaveBeenNthCalledWith(1, {
        deckId: 'deck_1',
        cardId: 'card_1',
        order: 0,
      });
      expect(prismaMock.db.orm.public.DeckCard.create).toHaveBeenNthCalledWith(2, {
        deckId: 'deck_1',
        cardId: 'card_2',
        order: 1,
      });

      expect(result.id).toBe('deck_1');
      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].id).toBe('card_1');
    });

    it('should create a deck without cards', async () => {
      const createDto = { name: 'Empty Deck' };
      const userId = 'user_1';
      const createdDeck = {
        id: 'deck_1',
        name: 'Empty Deck',
        isPublic: false,
        userId,
      };

      prismaMock.db.orm.public.Deck.create.mockResolvedValue(createdDeck);
      setupPopulateMocks([], []);

      const result = await service.create(createDto, userId);

      expect(prismaMock.db.orm.public.Deck.create).toHaveBeenCalledWith({
        name: 'Empty Deck',
        isPublic: false,
        userId,
      });
      expect(prismaMock.db.orm.public.DeckCard.create).not.toHaveBeenCalled();
      expect(result.cards).toHaveLength(0);
    });
  });

  describe('findAll', () => {
    it('should return all user decks populated', async () => {
      const userId = 'user_1';
      const mockDecks = [
        { id: 'deck_1', userId, name: 'Deck 1' },
      ];
      const deckAllMock = vi.fn().mockResolvedValue(mockDecks);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ all: deckAllMock });

      setupPopulateMocks([], []);

      const result = await service.findAll(userId);

      expect(prismaMock.db.orm.public.Deck.where).toHaveBeenCalledWith({ userId });
      expect(deckAllMock).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('deck_1');
      expect(result[0].cards).toEqual([]);
    });
  });

  describe('findPublic', () => {
    it('should return all public decks excluding current user', async () => {
      const allPublicDecks = [
        { id: 'deck_1', userId: 'user_1', name: 'Deck 1', isPublic: true },
        { id: 'deck_2', userId: 'user_2', name: 'Deck 2', isPublic: true },
      ];

      const deckAllMock = vi.fn().mockResolvedValue(allPublicDecks);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ all: deckAllMock });

      setupPopulateMocks([], []);

      const result = await service.findPublic('user_1');

      expect(prismaMock.db.orm.public.Deck.where).toHaveBeenCalledWith({ isPublic: true });
      expect(deckAllMock).toHaveBeenCalledTimes(1);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('deck_2');
    });

    it('should return all public decks if no current user provided', async () => {
      const allPublicDecks = [
        { id: 'deck_1', userId: 'user_1', name: 'Deck 1', isPublic: true },
      ];

      const deckAllMock = vi.fn().mockResolvedValue(allPublicDecks);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ all: deckAllMock });

      setupPopulateMocks([], []);

      const result = await service.findPublic();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('deck_1');
    });
  });

  describe('findOne', () => {
    it('should return a populated deck', async () => {
      const userId = 'user_1';
      const id = 'deck_1';
      const mockDeck = { id, userId, name: 'Deck 1' };

      const deckFirstMock = vi.fn().mockResolvedValue(mockDeck);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      setupPopulateMocks([], []);

      const result = await service.findOne(userId, id);

      expect(prismaMock.db.orm.public.Deck.where).toHaveBeenCalledWith({ id, userId });
      expect(deckFirstMock).toHaveBeenCalledTimes(1);
      expect(result.id).toBe(id);
    });

    it('should throw NotFoundException if deck not found', async () => {
      const userId = 'user_1';
      const id = 'deck_1';

      const deckFirstMock = vi.fn().mockResolvedValue(null);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      await expect(service.findOne(userId, id)).rejects.toThrow(NotFoundException);
    });
  });
  describe('update', () => {
    it('should update and return a populated deck', async () => {
      const userId = 'user_1';
      const id = 'deck_1';
      const updateDto = { name: 'Updated Deck' };
      const mockDeck = { id, userId, name: 'Original Deck' };
      const updatedDeck = { id, userId, name: 'Updated Deck' };

      const deckFirstMock = vi.fn()
        .mockResolvedValueOnce(mockDeck)
        .mockResolvedValueOnce(updatedDeck);
      const deckUpdateMock = vi.fn().mockResolvedValue({});

      prismaMock.db.orm.public.Deck.where.mockReturnValue({
        first: deckFirstMock,
        update: deckUpdateMock,
      });

      setupPopulateMocks([], []);

      const result = await service.update(userId, id, updateDto);

      expect(prismaMock.db.orm.public.Deck.where).toHaveBeenCalledWith({ id, userId });
      expect(deckUpdateMock).toHaveBeenCalledWith(updateDto);
      expect(result.name).toBe('Updated Deck');
    });

    it('should throw NotFoundException if deck to update does not exist', async () => {
      const deckFirstMock = vi.fn().mockResolvedValue(null);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      await expect(service.update('user_1', 'deck_1', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a deck if it exists', async () => {
      const userId = 'user_1';
      const id = 'deck_1';
      const mockDeck = { id, userId, name: 'Deck to Delete' };

      const deckFirstMock = vi.fn().mockResolvedValue(mockDeck);
      const deckDeleteMock = vi.fn().mockResolvedValue(mockDeck);

      prismaMock.db.orm.public.Deck.where.mockReturnValue({
        first: deckFirstMock,
        delete: deckDeleteMock,
      });

      const result = await service.delete(userId, id);

      expect(prismaMock.db.orm.public.Deck.where).toHaveBeenCalledWith({ id, userId });
      expect(deckDeleteMock).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockDeck);
    });

    it('should throw NotFoundException if deck to delete does not exist', async () => {
      const deckFirstMock = vi.fn().mockResolvedValue(null);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      await expect(service.delete('user_1', 'deck_1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('addCards', () => {
    it('should add new cards and return populated deck', async () => {
      const userId = 'user_1';
      const deckId = 'deck_1';
      const mockDeck = { id: deckId, userId };

      const deckFirstMock = vi.fn().mockResolvedValue(mockDeck);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      const existingDeckCards = [
        { id: 'dc_1', deckId, cardId: 'existing_card_1', order: 0 },
      ];

      const deckCardAllMock = vi.fn().mockResolvedValue(existingDeckCards);
      prismaMock.db.orm.public.DeckCard.where.mockReturnValue({ all: deckCardAllMock });
      prismaMock.db.orm.public.DeckCard.create.mockResolvedValue({});

      const cardWhereMock = vi.fn().mockReturnValue({ all: vi.fn().mockResolvedValue([]) });
      prismaMock.db.orm.public.Card.where = cardWhereMock;

      const dto = { cardIds: ['existing_card_1', 'new_card_1', 'new_card_2'] };

      await service.addCards(userId, deckId, dto);

      expect(prismaMock.db.orm.public.DeckCard.create).toHaveBeenCalledTimes(2);
      expect(prismaMock.db.orm.public.DeckCard.create).toHaveBeenNthCalledWith(1, {
        deckId,
        cardId: 'new_card_1',
        order: 1,
      });
      expect(prismaMock.db.orm.public.DeckCard.create).toHaveBeenNthCalledWith(2, {
        deckId,
        cardId: 'new_card_2',
        order: 2,
      });
    });

    it('should throw NotFoundException if deck does not exist', async () => {
      const deckFirstMock = vi.fn().mockResolvedValue(null);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      await expect(service.addCards('user_1', 'deck_1', { cardIds: [] })).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeCard', () => {
    it('should remove a card from the deck', async () => {
      const userId = 'user_1';
      const deckId = 'deck_1';
      const cardId = 'card_1';
      const mockDeck = { id: deckId, userId };

      const deckFirstMock = vi.fn().mockResolvedValue(mockDeck);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      const deckCards = [
        { id: 'dc_1', deckId, cardId: 'card_1', order: 0 },
        { id: 'dc_2', deckId, cardId: 'card_2', order: 1 },
      ];
      const deckCardAllMock = vi.fn().mockResolvedValue(deckCards);
      const deckCardDeleteMock = vi.fn().mockResolvedValue({});

      setupPopulateMocks(deckCards, []);

      prismaMock.db.orm.public.DeckCard.where.mockImplementation((params) => {
        if (params.id) return { delete: deckCardDeleteMock, all: deckCardAllMock };
        return { all: deckCardAllMock, delete: deckCardDeleteMock };
      });

      await service.removeCard(userId, deckId, cardId);

      expect(prismaMock.db.orm.public.DeckCard.where).toHaveBeenCalledWith({ id: 'dc_1' });
      expect(deckCardDeleteMock).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundException if deck does not exist', async () => {
      const deckFirstMock = vi.fn().mockResolvedValue(null);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      await expect(service.removeCard('user_1', 'deck_1', 'card_1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderCards', () => {
    it('should update the order of cards in a deck', async () => {
      const userId = 'user_1';
      const deckId = 'deck_1';
      const mockDeck = { id: deckId, userId };

      const deckFirstMock = vi.fn().mockResolvedValue(mockDeck);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      const deckCards = [
        { id: 'dc_1', deckId, cardId: 'card_1', order: 0 },
        { id: 'dc_2', deckId, cardId: 'card_2', order: 1 },
      ];
      const deckCardAllMock = vi.fn().mockResolvedValue(deckCards);
      const deckCardUpdateMock = vi.fn().mockResolvedValue({});

      setupPopulateMocks(deckCards, []);

      prismaMock.db.orm.public.DeckCard.where.mockImplementation((params) => {
        if (params.id) return { update: deckCardUpdateMock, all: deckCardAllMock };
        return { all: deckCardAllMock, update: deckCardUpdateMock };
      });

      const dto = { cardIds: ['card_2', 'card_1'] };
      await service.reorderCards(userId, deckId, dto);

      expect(prismaMock.db.orm.public.DeckCard.where).toHaveBeenCalledWith({ id: 'dc_2' });
      expect(deckCardUpdateMock).toHaveBeenNthCalledWith(1, { order: 0 });
      expect(prismaMock.db.orm.public.DeckCard.where).toHaveBeenCalledWith({ id: 'dc_1' });
      expect(deckCardUpdateMock).toHaveBeenNthCalledWith(2, { order: 1 });
    });

    it('should throw NotFoundException if deck does not exist', async () => {
      const deckFirstMock = vi.fn().mockResolvedValue(null);
      prismaMock.db.orm.public.Deck.where.mockReturnValue({ first: deckFirstMock });

      await expect(service.reorderCards('user_1', 'deck_1', { cardIds: [] })).rejects.toThrow(NotFoundException);
    });
  });
});
