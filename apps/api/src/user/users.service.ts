import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { CreateUserDto, UpdateUserDto } from "./users.dto";
import { hashSync } from "bcrypt";

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const newUser = await this.prisma.db.orm.public.User.create({
      username: data.username,
      email: data.email,
      password: hashSync(data.password, 10),
    });
    return newUser;
  }

  async findAll() {
    return this.prisma.db.orm.public.User.all();
  }

  async findOne(id: string) {
    return this.prisma.db.orm.public.User.where({ id: id });
  }

  async update(id: string, body: UpdateUserDto) {
    return this.prisma.db.orm.public.User.where({ id: id }).update({ ...body });
  }

  async delete(id: string) {
    return this.prisma.db.orm.public.User.where({ id: id }).delete();
  }
}
