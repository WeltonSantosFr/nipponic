import {
  Controller,
  Get,
  Post,
  Delete,
  Inject,
  Body,
  Headers,
  Req,
  UseGuards,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { SponsorsService } from "./sponsors.service";
import type { LinkGithubInput, MockSponsorshipInput } from "./sponsors.dto";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import type { JwtPayload } from "@nipponic/shared";
import type { Request } from "express";

@Controller("sponsors")
export class SponsorsController {
  constructor(
    @Inject(SponsorsService) private readonly sponsorsService: SponsorsService
  ) {}

  @Get()
  findAll() {
    return this.sponsorsService.findAllPublic();
  }

  @Post("link-github")
  @UseGuards(AuthGuard)
  linkGithub(
    @CurrentUser() user: JwtPayload,
    @Body() body: LinkGithubInput
  ) {
    return this.sponsorsService.linkGithub(user.sub, body);
  }

  @Post("webhook")
  async handleWebhook(
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Body() body: any,
    @Req() req: Request
  ) {
    // If signature is present, validate against request body
    const rawBody = (req as any).rawBody || JSON.stringify(body);
    const isValid = this.sponsorsService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      throw new UnauthorizedException("Invalid GitHub webhook signature");
    }

    return this.sponsorsService.handleWebhook(body);
  }

  @Post("mock")
  mockSponsor(@Body() body: MockSponsorshipInput) {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Mock sponsorships are not available in production");
    }
    return this.sponsorsService.mockSponsor(body);
  }

  @Delete("mock")
  clearMockSponsors() {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException("Mock sponsorships are not available in production");
    }
    return this.sponsorsService.clearMockSponsors();
  }
}
