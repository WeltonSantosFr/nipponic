import {
  Controller,
  Get,
  Post,
  Inject,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
} from "@nestjs/common";

import { UsersService } from "./users.service";
import type { CreateUserDto, UpdateUserDto } from "./users.dto";
import type { JwtPayload } from "@nipponic/shared";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(
    @Inject(UsersService) private readonly usersService: UsersService,
  ) {}

  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get("me")
  @UseGuards(AuthGuard)
  getMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findOne(user.sub);
  }

  @Patch("me")
  @UseGuards(AuthGuard)
  updateMe(@CurrentUser() user: JwtPayload, @Body() body: Partial<UpdateUserDto>) {
    return this.usersService.update(user.sub, body);
  }

  @Delete("me")
  @UseGuards(AuthGuard)
  deleteMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.delete(user.sub);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(@Param("id") id: string, @Body() body: Partial<UpdateUserDto>) {
    return this.usersService.update(id, body);
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  delete(@Param("id") id: string) {
    return this.usersService.delete(id);
  }
}
