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
import { AuthService } from "./auth.service";

export interface LoginUserDto {
  email: string;
  password: string;
}

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post("/login")
  login(@Body() body: LoginUserDto) { 
    const { email, password } = body;
    return this.authService.login({ email, password });
  }
}
