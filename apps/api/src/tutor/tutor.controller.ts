import {
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
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { TutorService } from "./tutor.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "@nipponic/shared";
import {
  SubmitLessonProgressSchema,
  SubmitLessonFeedbackSchema,
  type SubmitLessonProgressDto,
  type SubmitLessonFeedbackDto,
} from "./tutor.dto";

@Controller("tutor")
export class TutorController {
  constructor(
    @Inject(TutorService) private readonly tutorService: TutorService,
    @Optional() @Inject(JwtService) private readonly jwtService?: JwtService
  ) {}

  private extractUserId(request: Request): string | undefined {
    try {
      const [type, token] = request.headers.authorization?.split(" ") ?? [];
      if (type === "Bearer" && token && this.jwtService) {
        const payload = this.jwtService.decode(token) as JwtPayload | null;
        return payload?.sub;
      }
    } catch {
      // Ignore token decode errors for optional auth
    }
    return undefined;
  }

  @Get("curriculum")
  async getCurriculum(
    @Query("level") level: string = "N5",
    @Req() request: Request
  ) {
    const userId = this.extractUserId(request);
    return await this.tutorService.getCurriculum(level || "N5", userId);
  }

  @Get("topics/:topicId/lesson")
  async getLessonByTopic(
    @Param("topicId") topicId: string,
    @Req() request: Request
  ) {
    const userId = this.extractUserId(request);
    return await this.tutorService.getLessonByTopicId(topicId, userId);
  }

  @Post("lessons/:id/progress")
  @UseGuards(AuthGuard)
  async recordProgress(
    @Param("id") lessonId: string,
    @Body() body: SubmitLessonProgressDto,
    @CurrentUser() user: JwtPayload
  ) {
    const parsed = SubmitLessonProgressSchema.parse(body);
    return await this.tutorService.recordProgress(user.sub, lessonId, parsed.score);
  }

  @Post("lessons/:id/feedback")
  async submitFeedback(
    @Param("id") lessonId: string,
    @Body() body: SubmitLessonFeedbackDto,
    @Req() request: Request
  ) {
    const parsed = SubmitLessonFeedbackSchema.parse(body);
    const userId = this.extractUserId(request);
    return await this.tutorService.submitFeedback(
      lessonId,
      parsed.rating,
      parsed.comment,
      userId
    );
  }
}
