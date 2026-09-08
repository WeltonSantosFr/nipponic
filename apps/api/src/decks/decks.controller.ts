import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { DecksService } from "./decks.service";
import { AuthGuard } from "../auth/auth.guard";
import type {
  CreateDeckDto,
  UpdateDeckDto,
  AddCardsDto,
  ReorderCardsDto,
} from "./decks.dto";
import type { JwtPayload } from "@nipponic/shared";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("decks")
export class DecksController {
  constructor(
    @Inject(DecksService) private readonly decksService: DecksService
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() deck: CreateDeckDto, @CurrentUser() user: JwtPayload) {
    return this.decksService.create(deck, user.sub);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.decksService.findAll(user.sub);
  }

  @Get("public")
  @UseGuards(AuthGuard)
  findPublic(@CurrentUser() user: JwtPayload) {
    return this.decksService.findPublic(user.sub);
  }

  @Get(":id")
  @UseGuards(AuthGuard)
  findOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.decksService.findOne(user.sub, id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() deck: UpdateDeckDto
  ) {
    return this.decksService.update(user.sub, id, deck);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  delete(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.decksService.delete(user.sub, id);
  }

  @Post(":id/cards")
  @UseGuards(AuthGuard)
  addCards(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: AddCardsDto
  ) {
    return this.decksService.addCards(user.sub, id, dto);
  }

  @Delete(":id/cards/:cardId")
  @UseGuards(AuthGuard)
  removeCard(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Param("cardId") cardId: string
  ) {
    return this.decksService.removeCard(user.sub, id, cardId);
  }

  @Put(":id/reorder")
  @UseGuards(AuthGuard)
  reorderCards(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Body() dto: ReorderCardsDto
  ) {
    return this.decksService.reorderCards(user.sub, id, dto);
  }
}
