import { Controller, Get } from "@nestjs/common";
import type { MessageResponse } from "@nipponic/shared";

@Controller()
export class AppController {
  @Get()
  getRoot(): MessageResponse {
    return {
      message: "hello from create-prisma + nest",
    };
  }
}
