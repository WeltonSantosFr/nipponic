import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Inject,
  NotFoundException,
  Post,
  Req,
  ServiceUnavailableException,
  UnauthorizedException,
  UseGuards,
  type RawBodyRequest,
} from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import type { Request } from "express";
import type { JwtPayload } from "@nipponic/shared";
import { SponsorsService } from "./sponsors.service";
import {
  GithubSponsorsWebhookSchema,
  LinkGithubInputSchema,
  MockSponsorshipInputSchema,
  type LinkGithubInput,
} from "./sponsors.dto";
import { AuthGuard } from "../auth/auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";

/**
 * Mock sponsorship endpoints are a development convenience. They are disabled unless
 * explicitly enabled AND never available in production. When disabled they respond
 * with 404 so the routes are indistinguishable from non-existent ones.
 */
export function isMockSponsorsEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.ENABLE_MOCK_SPONSORS === "true" && env.NODE_ENV !== "production";
}

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
    const parsed = LinkGithubInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("A valid GitHub username is required");
    }
    return this.sponsorsService.linkGithub(user.sub, parsed.data);
  }

  // Authenticated by HMAC signature; GitHub delivers from shared IPs, so skip the IP rate limit
  @SkipThrottle()
  @Post("webhook")
  @HttpCode(200)
  async handleWebhook(
    @Headers("x-hub-signature-256") signature: string | undefined,
    @Headers("x-github-delivery") deliveryId: string | undefined,
    @Body() body: unknown,
    @Req() req: RawBodyRequest<Request>
  ) {
    if (!this.sponsorsService.isWebhookConfigured()) {
      throw new ServiceUnavailableException("Webhook receiver is not configured");
    }

    // The HMAC must be computed over the exact bytes GitHub sent.
    if (!req.rawBody) {
      throw new BadRequestException("Raw request body unavailable");
    }
    if (!this.sponsorsService.verifyWebhookSignature(req.rawBody, signature)) {
      throw new UnauthorizedException("Invalid GitHub webhook signature");
    }

    const parsed = GithubSponsorsWebhookSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Malformed webhook payload");
    }

    if (!this.sponsorsService.registerDelivery(deliveryId)) {
      return { status: "duplicate" };
    }

    return this.sponsorsService.handleWebhook(parsed.data);
  }

  @Post("mock")
  @UseGuards(AuthGuard)
  mockSponsor(@Body() body: unknown) {
    if (!isMockSponsorsEnabled()) throw new NotFoundException();
    const parsed = MockSponsorshipInputSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException("Invalid mock sponsorship payload");
    }
    return this.sponsorsService.mockSponsor(parsed.data);
  }

  @Delete("mock")
  @UseGuards(AuthGuard)
  clearMockSponsors() {
    if (!isMockSponsorsEnabled()) throw new NotFoundException();
    return this.sponsorsService.clearMockSponsors();
  }
}
