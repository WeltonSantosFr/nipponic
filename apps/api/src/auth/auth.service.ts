import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { compareSync, hashSync } from "bcrypt";
import { PrismaService } from "../prisma.service";
import type { LoginUserDto, AuthResponse } from "@nipponic/shared";
import { JwtService } from "@nestjs/jwt";

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

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, { expiresIn: '24h' }),
    };
  }
}
