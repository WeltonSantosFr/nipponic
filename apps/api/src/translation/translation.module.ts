import { Module } from "@nestjs/common";
import { TranslationController } from "./translation.controller";
import { TranslationService } from "./translation.service";
import { PrismaService } from "../prisma.service";

@Module({
  controllers: [TranslationController],
  providers: [TranslationService, PrismaService],
  exports: [TranslationService],
})
export class TranslationModule {}
