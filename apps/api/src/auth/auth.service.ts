import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { compareSync, hashSync } from "bcrypt";
import { PrismaService } from "../prisma.service";
import type { LoginUserDto, AuthResponse, JwtPayload } from "@nipponic/shared";
import { JwtService } from "@nestjs/jwt";

export function isConfiguredAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

// Compared against when the email is unknown so response time does not reveal
// whether an account exists (user enumeration via timing).
const DUMMY_PASSWORD_HASH = hashSync("nipponic-dummy-password", 10);

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginUserDto): Promise<AuthResponse> {
    const user = await this.prisma.db.orm.public.User.first({ email });

    const isPasswordValid = compareSync(password, user?.password ?? DUMMY_PASSWORD_HASH);

    if (!user) {
      throw new UnauthorizedException("Invalid Credentials");
    }

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid Credentials");
    }

    const userRole = (user as { role?: string }).role;
    const isAdmin = userRole === "ADMIN" || isConfiguredAdminEmail(user.email);

    if (isAdmin && userRole !== "ADMIN") {
      await this.prisma.db.orm.public.User.where({ id: user.id }).update({
        role: "ADMIN",
      }).catch(() => {});
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: isAdmin ? "ADMIN" : "USER",
    };

    return {
      access_token: await this.jwtService.signAsync(payload, { expiresIn: '24h' }),
    };
  }
}

