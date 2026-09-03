import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { CreateCardDto, UpdateCardDto } from "./cards.dto";

@Injectable()
export class CardsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(card: CreateCardDto, userId: string) {
    return await this.prisma.db.orm.public.Card.create({
      jpText: card.jpText,
      enText: card.enText,
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
    return await this.prisma.db.orm.public.Card.where({ id, userId }).update({
      ...card,
    });
  }

  async delete(userId: string, id: string) {
    return await this.prisma.db.orm.public.Card.where({ id, userId }).delete();
  }
}
