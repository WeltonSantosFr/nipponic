import {
  Body,
  Controller,
  Get,
  Inject,
  Optional,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { TranslationService } from "./translation.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type {
  JwtPayload,
  TranslationDailyState,
  SubmitTranslationDto,
  SubmitTranslationResponse,
  DevUnlockTranslationInput,
} from "@nipponic/shared";

@Controller("translation")
export class TranslationController {
  constructor(
    @Inject(TranslationService)
    private readonly translationService: TranslationService,
    @Optional() @Inject(JwtService)
    private readonly jwtService?: JwtService,
  ) {}

  /**
   * Optional authentication: returns the user id only when the bearer token has a
   * valid signature and is not expired. Forged or invalid tokens are treated as anonymous.
   */
  private async extractUserId(request: Request): Promise<string | undefined> {
    try {
      const [type, token] = request.headers.authorization?.split(" ") ?? [];
      if (type === "Bearer" && token && this.jwtService) {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
        return payload?.sub;
      }
    } catch {
      // Invalid or expired token: fall back to anonymous access
    }
    return undefined;
  }

  @Get("daily")
  async getDailyState(
    @Req() request: Request,
    @Query("localDate") localDate?: string,
  ): Promise<TranslationDailyState> {
    const userId = await this.extractUserId(request);
    return await this.translationService.getDailyState(userId, localDate);
  }

  @Post("submit")
  @UseGuards(AuthGuard)
  async submitAttempt(
    @CurrentUser() user: JwtPayload,
    @Body() body: SubmitTranslationDto,
  ): Promise<SubmitTranslationResponse> {
    return await this.translationService.submitAttempt(user.sub, body);
  }

  @Post("dev-unlock")
  @UseGuards(AuthGuard)
  async devUnlock(
    @CurrentUser() user: JwtPayload,
    @Body() body?: DevUnlockTranslationInput,
    @Query("localDate") localDate?: string,
  ): Promise<TranslationDailyState> {
    return await this.translationService.devUnlock(user.sub, body, localDate);
  }
}
