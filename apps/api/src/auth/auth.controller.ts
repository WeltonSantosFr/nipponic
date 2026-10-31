import {
  Controller,
  Get,
  Post,
  Inject,
  Req,
  Body,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import type { LoginUserDto, AuthResponse } from "@nipponic/shared";

export type { LoginUserDto };
import { LoginSchema } from "@nipponic/shared";
import { ZodValidationPipe } from "../common/zod-validation.pipe";

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  // Brute-force protection: 5 attempts per minute per IP
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("/login")
  login(@Body(new ZodValidationPipe(LoginSchema)) body: LoginUserDto): Promise<AuthResponse> { 
    const { email, password } = body;
    return this.authService.login({ email, password });
  }
}
