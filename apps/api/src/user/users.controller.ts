import {
  Controller,
  Get,
  Post,
  Inject,
  Body,
  Param,
  Patch,
  Delete,
} from "@nestjs/common";

import { UsersService } from "./users.service";
import type { CreateUserDto, UpdateUserDto } from "./users.dto";

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

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() body: UpdateUserDto) {
    return this.usersService.update(id, body);
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.usersService.delete(id);
  }
}
