import { Inject, Injectable, NotFoundException } from "@nestjs/common";
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

    let newInterval = 1;
    let newEase = currentEase;
    let newReps = currentReps;
    let newLapses = currentLapses;
    let nextReviewDate: Date;

    const now = new Date();

    switch (rating) {
      case 1: // Again (Forgot)
        newReps = 0;
        newInterval = 0; // Due in 10 minutes
        newLapses = currentLapses + 1;
        newEase = Math.max(1.3, currentEase - 0.2);
        nextReviewDate = new Date(now.getTime() + 10 * 60 * 1000);
        break;

      case 2: // Hard (Difficult recall)
        newReps = currentReps + 1;
        newInterval = currentInterval <= 1 ? 1 : Math.max(1, Math.round(currentInterval * 1.2));
        newEase = Math.max(1.3, currentEase - 0.15);
        nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
        break;

      case 3: // Good (Standard correct recall)
        if (currentReps === 0) {
          newInterval = 1;
        } else if (currentReps === 1) {
          newInterval = 3;
        } else {
          newInterval = Math.max(1, Math.round((currentInterval || 1) * currentEase));
        }
        newReps = currentReps + 1;
        newEase = currentEase;
        nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
        break;

      case 4: // Easy (Instant effortless recall)
        if (currentReps === 0) {
          newInterval = 4;
        } else if (currentReps === 1) {
          newInterval = 7;
        } else {
          newInterval = Math.max(1, Math.round((currentInterval || 1) * currentEase * 1.3));
        }
        newReps = currentReps + 1;
        newEase = currentEase + 0.15;
        nextReviewDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);
        break;
    }

    const roundedEase = Math.round(newEase * 100) / 100;

    return await this.prisma.db.orm.public.Card.where({ id, userId }).update({
      interval: newInterval,
      easeFactor: roundedEase,
      repetitions: newReps,
      lapses: newLapses,
      nextReviewAt: nextReviewDate,
      lastReviewedAt: now,
    });
  }
}

