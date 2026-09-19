import { ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { CreateUserDto, UpdateUserDto } from "./users.dto";
import { hashSync } from "bcrypt";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const existing = await this.prisma.db.orm.public.User.first({ email: data.email });
    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

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
    const user = await this.prisma.db.orm.public.User.first({ id });
    if (!user) return null;

    if (user.githubUsername) {
      const sponsor = await this.prisma.db.orm.public.Sponsor.first({
        githubUsername: user.githubUsername,
      });
      if (sponsor) {
        return {
          ...user,
          isSupporter: true,
          isActiveSupporter: sponsor.isActive,
          tierName: sponsor.tierName,
        };
      }
    }

    return user;
  }

  async update(id: string, body: Partial<UpdateUserDto>) {
    const dataToUpdate: any = { ...body };
    if (dataToUpdate.password) {
      dataToUpdate.password = hashSync(dataToUpdate.password, 10);
    }
    if (dataToUpdate.githubUsername !== undefined) {
      if (dataToUpdate.githubUsername) {
        dataToUpdate.githubUsername = dataToUpdate.githubUsername.toLowerCase().trim().replace(/^@/, "");
        const existing = await this.prisma.db.orm.public.User.first({
          githubUsername: dataToUpdate.githubUsername,
        });
        if (existing && existing.id !== id) {
          throw new ConflictException("This GitHub username is already linked to another account");
        }
      } else {
        dataToUpdate.githubUsername = null;
      }
    }

    const updated = await this.prisma.db.orm.public.User.where({ id: id }).update(dataToUpdate);

    if (dataToUpdate.githubUsername) {
      const sponsor = await this.prisma.db.orm.public.Sponsor.first({
        githubUsername: dataToUpdate.githubUsername,
      });
      if (sponsor) {
        await this.prisma.db.orm.public.Sponsor.where({ id: sponsor.id }).update({
          userId: id,
        });
      }
    }

    return updated;
  }

  async delete(id: string) {
    try {
      await this.prisma.db.orm.public.Note.where({ userId: id }).delete();
    } catch (error) {
      this.logger.error(`Failed to delete notes for user ${id}`, error);
    }
    return this.prisma.db.orm.public.User.where({ id: id }).delete();
  }
}

