import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FeedbackService } from "./feedback.service";
import { AuthGuard } from "../auth/auth.guard";
import { RolesGuard } from "../auth/roles.guard";
import { Roles } from "../auth/roles.decorator";
import { CurrentUser } from "../auth/current-user.decorator";
import type {
  CreateFeedbackTicketDto,
  UpdateFeedbackTicketDto,
  FeedbackListQueryDto,
  JwtPayload,
} from "@nipponic/shared";

@Controller("feedback")
export class FeedbackController {
  constructor(
    @Inject(FeedbackService)
    private readonly feedbackService: FeedbackService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: CreateFeedbackTicketDto,
  ) {
    return this.feedbackService.create(user.sub, body);
  }

  @Get("admin")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  listAdmin(@Query() query: FeedbackListQueryDto) {
    return this.feedbackService.list(query);
  }

  @Get("admin/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  findOneAdmin(@Param("id") id: string) {
    return this.feedbackService.findOne(id);
  }

  @Patch("admin/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  updateAdmin(
    @Param("id") id: string,
    @Body() body: UpdateFeedbackTicketDto,
  ) {
    return this.feedbackService.update(id, body);
  }

  @Delete("admin/:id")
  @UseGuards(AuthGuard, RolesGuard)
  @Roles("ADMIN")
  removeAdmin(@Param("id") id: string) {
    return this.feedbackService.remove(id);
  }
}
