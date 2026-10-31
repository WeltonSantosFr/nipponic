import {
  Controller,
  Post,
  Get,
  Inject,
  Body,
  Patch,
  Delete,
  UseGuards,
} from "@nestjs/common";

import { Throttle } from "@nestjs/throttler";
import { UsersService } from "./users.service";
import type { CreateUserDto, UpdateUserDto } from "./users.dto";
import type { JwtPayload } from "@nipponic/shared";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

/**
 * NOTE: Listing users and addressing other users by id (`GET /users`, `/users/:id`)
 * is intentionally NOT exposed. Users can only access their own record via `/users/me`.
 */
import { CreateUserSchema, UpdateUserSchema } from "@nipponic/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("users")
export class UsersController {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  // Sign-up abuse protection: 5 accounts per minute per IP
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post()
  create(@Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  updateMe(@CurrentUser() user: JwtPayload, @Body(new ZodValidationPipe(UpdateUserSchema)) body: Partial<UpdateUserDto>) {
    return this.usersService.update(user.sub, body);
  }

  @Delete("me")
  @UseGuards(AuthGuard)
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.delete(user.sub);
  }
}
