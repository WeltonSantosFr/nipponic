import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { CreateUserDto, UpdateUserDto } from "./users.dto";
import { compareSync, hashSync } from "bcrypt";
import { isConfiguredAdminEmail } from "../auth/auth.service";

/**
 * Removes credential material from a user record before it leaves the service layer.
 * Every API response that contains a user MUST go through this function.
 */
export function toPublicUser<T extends { password?: unknown }>(
  user: T,
): Omit<T, "password"> {
  const { password: _password, ...rest } = user;
  return rest;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async create(data: CreateUserDto) {
    const existing = await this.prisma.db.orm.public.User.first({ email: data.email });
    if (existing) {
      throw new ConflictException("User with this email already exists");
    }

    const isConfiguredAdmin = isConfiguredAdminEmail(data.email);
    const newUser = await this.prisma.db.orm.public.User.create({
      username: data.username,
      email: data.email,
      password: hashSync(data.password, 10),
      role: isConfiguredAdmin ? "ADMIN" : "USER",
    });
    return toPublicUser(newUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.db.orm.public.User.first({ id });
    if (!user) return null;

    const publicUser = toPublicUser(user);
    const userRole = (user as { role?: string }).role;
    const isConfiguredAdmin = isConfiguredAdminEmail(user.email);
    const resolvedRole = userRole === "ADMIN" || isConfiguredAdmin ? "ADMIN" : "USER";

    if (user.githubUsername) {
      const sponsor = await this.prisma.db.orm.public.Sponsor.first({
        githubUsername: user.githubUsername,
      });
      if (sponsor) {
        return {
          ...publicUser,
          role: resolvedRole,
          isSupporter: true,
          isActiveSupporter: sponsor.isActive,
          tierName: sponsor.tierName,
        };
      }
    }

    return {
      ...publicUser,
      role: resolvedRole,
    };
  }

  async update(id: string, body: Partial<UpdateUserDto>) {
    const { currentPassword, ...rest } = body;
    const dataToUpdate: Record<string, unknown> & {
      password?: string;
      githubUsername?: string | null;
    } = { ...rest };

    if (dataToUpdate.password) {
      if (!currentPassword) {
        throw new BadRequestException("Current password is required to change your password");
      }
      const current = await this.prisma.db.orm.public.User.first({ id });
      if (!current || !compareSync(currentPassword, current.password)) {
        throw new UnauthorizedException("Current password is incorrect");
      }
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

    return updated ? toPublicUser(updated) : updated;
  }

  async delete(id: string) {
    try {
      await this.prisma.db.orm.public.Note.where({ userId: id }).delete();
    } catch (error) {
      this.logger.error(`Failed to delete notes for user ${id}`, error);
    }
    const deleted = await this.prisma.db.orm.public.User.where({ id: id }).delete();
    return deleted ? toPublicUser(deleted) : deleted;
  }
}
