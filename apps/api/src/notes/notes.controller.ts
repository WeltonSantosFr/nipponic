import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { NotesService } from "./notes.service";
import { AuthGuard } from "../auth/auth.guard";
import type { Note } from "./notes.dto";

import { CurrentUser } from "../auth/current-user.decorator";


interface jwtPayload {
  sub: string;
  email: string;
  username: string;
}

@Controller("notes")
export class NotesController {
  constructor(
    @Inject(NotesService) private readonly notesService: NotesService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() note: Note, @CurrentUser() user: jwtPayload) {
    return this.notesService.create(note, user.sub);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: jwtPayload) {
    return this.notesService.findAll(user.sub)
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(@CurrentUser() user: jwtPayload, @Param('id') id:string, @Body() note: Partial<Note>) {
    return this.notesService.update(user.sub, id, note)
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  delete(@CurrentUser() user: jwtPayload, @Param('id') id:string) {
    return this.notesService.delete(user.sub, id)
  }
}
