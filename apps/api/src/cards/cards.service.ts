import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { calculateNextReview } from "@nipponic/shared";
import { PrismaService } from "../prisma.service";
import type { CreateCardDto, ReviewRating, UpdateCardDto } from "./cards.dto";

@Injectable()
export class CardsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(card: CreateCardDto, userId: string) {
    return await this.prisma.db.orm.public.Card.create({
      jpText: card.jpText,
      enText: card.enText,
      interval: card.interval ?? 0,
      easeFactor: card.easeFactor ?? 2.5,
      repetitions: card.repetitions ?? 0,
      lapses: card.lapses ?? 0,
      nextReviewAt: card.nextReviewAt ? new Date(card.nextReviewAt) : null,
      lastReviewedAt: card.lastReviewedAt ? new Date(card.lastReviewedAt) : null,
      userId,
    });
  }

  async findAll(userId: string) {
    return await this.prisma.db.orm.public.Card.where({ userId }).all();
  }

  async findOne(userId: string, id: string) {
    return await this.prisma.db.orm.public.Card.where({ id, userId }).first();
  }

  async update(userId: string, id: string, card: UpdateCardDto) {
    const updateData: any = {};
    if (card.jpText !== undefined) updateData.jpText = card.jpText;
    if (card.enText !== undefined) updateData.enText = card.enText;
    if (card.interval !== undefined) updateData.interval = card.interval;
    if (card.easeFactor !== undefined) updateData.easeFactor = card.easeFactor;
    if (card.repetitions !== undefined) updateData.repetitions = card.repetitions;
    if (card.lapses !== undefined) updateData.lapses = card.lapses;
    if (card.nextReviewAt !== undefined) {
      updateData.nextReviewAt = card.nextReviewAt ? new Date(card.nextReviewAt) : null;
    }
    if (card.lastReviewedAt !== undefined) {
      updateData.lastReviewedAt = card.lastReviewedAt ? new Date(card.lastReviewedAt) : null;
    }

    return await this.prisma.db.orm.public.Card.where({ id, userId }).update(updateData);
  }

  async delete(userId: string, id: string) {
    return await this.prisma.db.orm.public.Card.where({ id, userId }).delete();
  }

  async review(userId: string, id: string, rating: ReviewRating) {
    const existingCard = await this.prisma.db.orm.public.Card.where({ id, userId }).first();
    if (!existingCard) {
      throw new NotFoundException(`Card with ID "${id}" not found`);
    }

    const currentEase = existingCard.easeFactor ?? 2.5;
    const currentReps = existingCard.repetitions ?? 0;
    const currentInterval = existingCard.interval ?? 0;
    const currentLapses = existingCard.lapses ?? 0;

    const result = calculateNextReview(
      {
        interval: currentInterval,
        easeFactor: currentEase,
        repetitions: currentReps,
        lapses: currentLapses,
      },
      rating
    );

    return await this.prisma.db.orm.public.Card.where({ id, userId }).update({
      interval: result.interval,
      easeFactor: result.easeFactor,
      repetitions: result.repetitions,
      lapses: result.lapses,
      nextReviewAt: new Date(result.nextReviewAt),
      lastReviewedAt: new Date(result.lastReviewedAt),
    });
  }
}

