import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CardsService } from "./cards.service";
import { AuthGuard } from "../auth/auth.guard";
import type { CreateCardDto, ReviewCardDto, UpdateCardDto } from "./cards.dto";
import type { JwtPayload } from "@nipponic/shared";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("cards")
export class CardsController {
  constructor(
    @Inject(CardsService) private readonly cardsService: CardsService
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() card: CreateCardDto, @CurrentUser() user: JwtPayload) {
    return this.cardsService.create(card, user.sub);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.cardsService.findAll(user.sub);
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cardsService.findOne(user.sub, id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() card: UpdateCardDto
  ) {
    return this.cardsService.update(user.sub, id, card);
  }

  @Post(":id/review")
  @UseGuards(AuthGuard)
  review(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() body: ReviewCardDto
  ) {
    return this.cardsService.review(user.sub, id, body.rating);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  delete(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.cardsService.delete(user.sub, id);
  }
}

