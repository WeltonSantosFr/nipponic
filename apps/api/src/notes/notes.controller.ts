import { Body, Controller, Delete, Get, Inject, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { NotesService } from "./notes.service";
import { AuthGuard } from "../auth/auth.guard";
import type { CreateNoteDto, UpdateNoteDto } from "./notes.dto";
import type { JwtPayload } from "@nipponic/shared";
import { CurrentUser } from "../auth/current-user.decorator";

@Controller("notes")
export class NotesController {
  constructor(
    @Inject(NotesService) private readonly notesService: NotesService,
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() note: CreateNoteDto, @CurrentUser() user: JwtPayload) {
    return this.notesService.create(note, user.sub);
  }

  @Get()
  @UseGuards(AuthGuard)
  findAll(@CurrentUser() user: JwtPayload) {
    return this.notesService.findAll(user.sub)
  }

  @Patch(":id")
  @UseGuards(AuthGuard)
  update(@CurrentUser() user: JwtPayload, @Param('id') id:string, @Body() note: UpdateNoteDto) {
    return this.notesService.update(user.sub, id, note)
  }

  @Delete(":id")
  @UseGuards(AuthGuard)
  delete(@CurrentUser() user: JwtPayload, @Param('id') id:string) {
    return this.notesService.delete(user.sub, id)
  }
}
