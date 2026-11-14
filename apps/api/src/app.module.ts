import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma.service";

import { UsersController } from "./user/users.controller";
import { UsersService } from "./user/users.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { AuthModule } from "./auth/auth.module";
import { NotesModule } from "./notes/notes.module";
import { CardsModule } from "./cards/cards.module";
import { DecksModule } from "./decks/decks.module";
import { SponsorsModule } from "./sponsors/sponsors.module";
import { TutorModule } from "./tutor/tutor.module";
import { StatsModule } from "./stats/stats.module";
import { FeedbackModule } from "./feedback/feedback.module";
import { TranslationModule } from "./translation/translation.module";

@Module({
  imports: [
    // Global baseline: 100 requests/minute per client IP. Sensitive routes override it with @Throttle.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 100 }]),
    AuthModule, NotesModule, CardsModule, DecksModule, SponsorsModule, TutorModule, StatsModule, FeedbackModule, TranslationModule],
  controllers: [AppController, UsersController],
  providers: [PrismaService, UsersService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
