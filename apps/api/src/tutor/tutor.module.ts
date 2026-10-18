import { Module } from "@nestjs/common";
import { TutorController } from "./tutor.controller";
import { TutorService } from "./tutor.service";
import { GeminiService } from "./gemini.service";
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [TutorController],
  providers: [TutorService, GeminiService, PrismaService],
  exports: [TutorService],
})
export class TutorModule {}
