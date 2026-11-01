import { Controller, Get, Inject, UseGuards } from "@nestjs/common";
import { StatsService } from "./stats.service";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload, StudyStats } from "@nipponic/shared";

@Controller("stats")
export class StatsController {
  constructor(
    @Inject(StatsService) private readonly statsService: StatsService
  ) {}

  @Get("dashboard")
  @UseGuards(AuthGuard)
  async getDashboard(@CurrentUser() user: JwtPayload): Promise<StudyStats> {
    return await this.statsService.getDashboardStats(user.sub);
  }
}
