import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
  Optional,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { TutorService } from "./tutor.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "@nipponic/shared";
import {
  SubmitLessonProgressSchema,
  SubmitLessonFeedbackSchema,
  CurriculumLevelSchema,
  type SubmitLessonProgressDto,
  type SubmitLessonFeedbackDto,
} from "./tutor.dto";

function parseLevel(level: unknown) {
  const parsed = CurriculumLevelSchema.safeParse(level || "N5");
  if (!parsed.success) {
    throw new BadRequestException(
      "Invalid level. Expected one of N5, N4, N3, N2, N1",
    );
  }
  return parsed.data;
}

@Controller("tutor")
export class TutorController {
  constructor(
    @Inject(TutorService) private readonly tutorService: TutorService,
    @Optional() @Inject(JwtService) private readonly jwtService?: JwtService,
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

  @Get("curriculum")
  async getCurriculum(
    @Query("level") level: string = "N5",
    @Req() request: Request,
  ) {
    const userId = await this.extractUserId(request);
    return await this.tutorService.getCurriculum(parseLevel(level), userId);
  }

  // Each call consumes Gemini quota: 5 per minute per IP
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post("curriculum/generate")
  @UseGuards(AuthGuard)
  async generateNextUnit(
    @Body("level") level: string = "N5",
    @CurrentUser() user: JwtPayload,
  ) {
    return await this.tutorService.generateNextUnitForLevel(
      parseLevel(level),
      user.sub,
    );
  }

  @Get("topics/:topicId/lesson")
  async getLessonByTopic(
    @Param("topicId") topicId: string,
    @Req() request: Request,
  ) {
    const userId = await this.extractUserId(request);
    return await this.tutorService.getLessonByTopicId(topicId, userId);
  }

  @Post("lessons/:id/progress")
  @UseGuards(AuthGuard)
  async recordProgress(
    @Param("id") lessonId: string,
    @Body() body: SubmitLessonProgressDto,
    @CurrentUser() user: JwtPayload,
  ) {
    const parsed = SubmitLessonProgressSchema.parse(body);
    return await this.tutorService.recordProgress(
      user.sub,
      lessonId,
      parsed.score,
    );
  }

  @Post("lessons/:id/feedback")
  async submitFeedback(
    @Param("id") lessonId: string,
    @Body() body: SubmitLessonFeedbackDto,
    @Req() request: Request,
  ) {
    const parsed = SubmitLessonFeedbackSchema.parse(body);
    const userId = await this.extractUserId(request);
    return await this.tutorService.submitFeedback(
      lessonId,
      parsed.rating,
      parsed.comment,
      userId,
    );
  }
}
