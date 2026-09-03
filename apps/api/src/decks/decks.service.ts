import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type {
  CreateDeckDto,
  UpdateDeckDto,
  AddCardsDto,
  ReorderCardsDto,
} from "./decks.dto";

@Injectable()
export class DecksService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async populateDeckCards(deck: {
    id: string;
    name: string;
    isPublic: boolean;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const deckCards = await this.prisma.db.orm.public.DeckCard.where({
      deckId: deck.id,
    }).all();

    deckCards.sort((a, b) => a.order - b.order);

    const userCards = await this.prisma.db.orm.public.Card.where({
      userId: deck.userId,
    }).all();
    const cardsMap = new Map(userCards.map((c) => [c.id, c]));

    const cards = deckCards
      .map((dc) => cardsMap.get(dc.cardId))
      .filter((c): c is NonNullable<typeof c> => !!c);

    return {
      ...deck,
      cards,
    };
  }

  async create(deck: CreateDeckDto, userId: string) {
    const created = await this.prisma.db.orm.public.Deck.create({
      name: deck.name,
      isPublic: deck.isPublic ?? false,
      userId,
    });

    if (deck.cardIds && deck.cardIds.length > 0) {
      for (let i = 0; i < deck.cardIds.length; i++) {
        await this.prisma.db.orm.public.DeckCard.create({
          deckId: created.id,
          cardId: deck.cardIds[i],
          order: i,
        });
      }
    }

    return await this.populateDeckCards(created);
  }

  async findAll(userId: string) {
    const decks = await this.prisma.db.orm.public.Deck.where({ userId }).all();
    const userCards = await this.prisma.db.orm.public.Card.where({
      userId,
    }).all();
    const cardsMap = new Map(userCards.map((c) => [c.id, c]));

    const populated = await Promise.all(
      decks.map(async (deck) => {
        const deckCards = await this.prisma.db.orm.public.DeckCard.where({
          deckId: deck.id,
        }).all();

        deckCards.sort((a, b) => a.order - b.order);

        const cards = deckCards
          .map((dc) => cardsMap.get(dc.cardId))
          .filter((c): c is NonNullable<typeof c> => !!c);

        return {
          ...deck,
          cards,
        };
      })
    );

    return populated;
  }

  async findOne(userId: string, id: string) {
    const deck = await this.prisma.db.orm.public.Deck.where({
      id,
      userId,
    }).first();
    if (!deck) {
      throw new NotFoundException("Deck not found");
    }

    return await this.populateDeckCards(deck);
  }

  async update(userId: string, id: string, deck: UpdateDeckDto) {
    const existing = await this.prisma.db.orm.public.Deck.where({
      id,
      userId,
    }).first();
    if (!existing) {
      throw new NotFoundException("Deck not found");
    }

    await this.prisma.db.orm.public.Deck.where({ id, userId }).update({
      ...deck,
    });

    return await this.findOne(userId, id);
  }

  async delete(userId: string, id: string) {
    const existing = await this.prisma.db.orm.public.Deck.where({
      id,
      userId,
    }).first();
    if (!existing) {
      throw new NotFoundException("Deck not found");
    }

    return await this.prisma.db.orm.public.Deck.where({ id, userId }).delete();
  }

  async addCards(userId: string, deckId: string, dto: AddCardsDto) {
    const deck = await this.prisma.db.orm.public.Deck.where({
      id: deckId,
      userId,
    }).first();
    if (!deck) {
      throw new NotFoundException("Deck not found");
    }

    const existingDeckCards =
      await this.prisma.db.orm.public.DeckCard.where({ deckId }).all();
    let currentMax = existingDeckCards.reduce(
      (max, dc) => Math.max(max, dc.order),
      -1
    );
    const existingCardIds = new Set(existingDeckCards.map((dc) => dc.cardId));

    for (const cardId of dto.cardIds) {
      if (!existingCardIds.has(cardId)) {
        currentMax++;
        await this.prisma.db.orm.public.DeckCard.create({
          deckId,
          cardId,
          order: currentMax,
        });
        existingCardIds.add(cardId);
      }
    }

    return await this.populateDeckCards(deck);
  }

  async removeCard(userId: string, deckId: string, cardId: string) {
    const deck = await this.prisma.db.orm.public.Deck.where({
      id: deckId,
      userId,
    }).first();
    if (!deck) {
      throw new NotFoundException("Deck not found");
    }

    const deckCards =
      await this.prisma.db.orm.public.DeckCard.where({ deckId }).all();
    const target = deckCards.find((dc) => dc.cardId === cardId);
    if (target) {
      await this.prisma.db.orm.public.DeckCard.where({ id: target.id }).delete();
    }

    return await this.populateDeckCards(deck);
  }

  async reorderCards(userId: string, deckId: string, dto: ReorderCardsDto) {
    const deck = await this.prisma.db.orm.public.Deck.where({
      id: deckId,
      userId,
    }).first();
    if (!deck) {
      throw new NotFoundException("Deck not found");
    }

    const existingDeckCards =
      await this.prisma.db.orm.public.DeckCard.where({ deckId }).all();

    for (let i = 0; i < dto.cardIds.length; i++) {
      const cardId = dto.cardIds[i];
      const target = existingDeckCards.find((dc) => dc.cardId === cardId);
      if (target) {
        await this.prisma.db.orm.public.DeckCard.where({ id: target.id }).update({
          order: i,
        });
      }
    }

    return await this.populateDeckCards(deck);
  }
}
