import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { compareSync } from "bcrypt";
import { PrismaService } from "../prisma.service";
import type { LoginUserDto } from "./auth.controller";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
  ) {}

  async login({ email, password }: LoginUserDto) {
    const user = await this.prisma.db.orm.public.User.first({ email });
    console.log(user);

    if (!user) {
      throw new UnauthorizedException("Invalid Credentials");
    }

    const isPasswordValid = compareSync(password, user.password);

    console.log(isPasswordValid);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid Credentials");
    }

    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
    };

    return {
      access_token: await this.jwtService.signAsync(payload, {expiresIn: '7d'}),
    };
  }
}
