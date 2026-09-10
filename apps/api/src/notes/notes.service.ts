import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { CreateNoteDto, UpdateNoteDto } from "./notes.dto";

@Injectable()
export class NotesService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(note: CreateNoteDto, userId: string) {
    return await this.prisma.db.orm.public.Note.create({ ...note, userId: userId });
  }

  async findAll(userId: string) {
    return await this.prisma.db.orm.public.Note.where({userId}).all();
  }

  async update(userId:string, id:string, note:UpdateNoteDto) {
    return await this.prisma.db.orm.public.Note.where({id, userId}).update({...note})
  }

  async delete(userId:string, id:string) {
    return await this.prisma.db.orm.public.Note.where({id, userId}).delete()
  }
}
