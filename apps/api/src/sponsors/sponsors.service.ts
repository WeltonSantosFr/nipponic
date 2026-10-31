import { ConflictException, Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import type { LinkGithubInput, MockSponsorshipInput } from "./sponsors.dto";
import * as crypto from "node:crypto";
import type { GithubSponsorsWebhookPayload } from "@nipponic/shared";

@Injectable()
export class SponsorsService {
  private readonly logger = new Logger(SponsorsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findAllPublic() {
    const sponsors = await this.prisma.db.orm.public.Sponsor.all();

    // Sort: active sponsors first, then by most recent creation date
    return sponsors
      .map((s) => ({
        id: s.id,
        githubUsername: s.githubUsername,
        name: s.name || s.githubUsername,
        avatarUrl: s.avatarUrl || `https://github.com/${s.githubUsername}.png`,
        tierName: s.tierName,
        monthlyPriceInCents: s.monthlyPriceInCents,
        isOneTime: s.isOneTime,
        isActive: s.isActive,
        createdAt: s.createdAt,
      }))
      .sort((a, b) => {
        if (a.isActive && !b.isActive) return -1;
        if (!a.isActive && b.isActive) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  async linkGithub(userId: string, data: LinkGithubInput) {
    const githubUsername = data.githubUsername.toLowerCase().trim().replace(/^@/, "");

    // Check if another user already uses this githubUsername
    const existingUser = await this.prisma.db.orm.public.User.first({
      githubUsername,
    });

    if (existingUser && existingUser.id !== userId) {
      throw new ConflictException("This GitHub username is already linked to another account");
    }

    // Update current user
    await this.prisma.db.orm.public.User.where({ id: userId }).update({
      githubUsername,
    });

    // If a sponsorship record already exists for this githubUsername, link userId
    const sponsor = await this.prisma.db.orm.public.Sponsor.first({
      githubUsername,
    });

    if (sponsor) {
      await this.prisma.db.orm.public.Sponsor.where({ id: sponsor.id }).update({
        userId,
      });

      return {
        success: true,
        githubUsername,
        isSupporter: true,
        isActiveSupporter: sponsor.isActive,
        tierName: sponsor.tierName,
      };
    }

    return {
      success: true,
      githubUsername,
      isSupporter: false,
      isActiveSupporter: false,
      tierName: null,
    };
  }

  private static readonly DELIVERY_TTL_MS = 24 * 60 * 60 * 1000;
  private static readonly DELIVERY_CACHE_MAX = 5000;
  private readonly processedDeliveries = new Map<string, number>();

  isWebhookConfigured(): boolean {
    return !!process.env.GITHUB_SPONSORS_WEBHOOK_SECRET;
  }

  /**
   * Verifies the GitHub `X-Hub-Signature-256` HMAC over the RAW request body.
   * Fails closed: without a configured secret every request is rejected.
   */
  verifyWebhookSignature(rawBody: string | Buffer, signatureHeader?: string): boolean {
    const secret = process.env.GITHUB_SPONSORS_WEBHOOK_SECRET;
    if (!secret || !signatureHeader) {
      return false;
    }

    const calculated = Buffer.from(
      `sha256=${crypto.createHmac("sha256", secret).update(rawBody).digest("hex")}`,
    );
    const received = Buffer.from(signatureHeader);

    return received.length === calculated.length && crypto.timingSafeEqual(calculated, received);
  }

  /**
   * Idempotency guard for webhook retries/replays, keyed by `X-GitHub-Delivery`.
   * Returns true the first time a delivery id is seen within the TTL window.
   * (In-memory: sufficient for a single API instance; entries expire after 24h.)
   */
  registerDelivery(deliveryId?: string): boolean {
    if (!deliveryId) return true;

    const now = Date.now();
    for (const [id, seenAt] of this.processedDeliveries) {
      if (now - seenAt > SponsorsService.DELIVERY_TTL_MS) this.processedDeliveries.delete(id);
      else break; // Map keeps insertion order, so the rest are newer
    }

    if (this.processedDeliveries.has(deliveryId)) return false;

    if (this.processedDeliveries.size >= SponsorsService.DELIVERY_CACHE_MAX) {
      const oldest = this.processedDeliveries.keys().next().value;
      if (oldest !== undefined) this.processedDeliveries.delete(oldest);
    }
    this.processedDeliveries.set(deliveryId, now);
    return true;
  }

  async handleWebhook(payload: GithubSponsorsWebhookPayload) {
    const action = payload.action;
    const sponsorship = payload.sponsorship;
    const sponsor = sponsorship?.sponsor;
    const tier = sponsorship?.tier;

    if (!sponsor?.login) {
      this.logger.warn(`Webhook received without sponsor login (action: ${payload.action ?? "unknown"})`);
      return { status: "ignored" };
    }

    const githubUsername = sponsor.login.toLowerCase().trim();
    const avatarUrl = sponsor.avatar_url || `https://github.com/${githubUsername}.png`;
    const githubUserId = sponsor.id ? String(sponsor.id) : null;
    const tierName = tier?.name || "GitHub Sponsor";
    const monthlyPriceInCents = tier?.monthly_price_in_cents ?? 0;
    const isOneTime = !!tier?.is_one_time;
    const isActive = action !== "cancelled";

    // Look for local user with the same githubUsername
    const linkedUser = await this.prisma.db.orm.public.User.first({
      githubUsername,
    });

    const existingSponsor = await this.prisma.db.orm.public.Sponsor.first({
      githubUsername,
    });

    if (existingSponsor) {
      await this.prisma.db.orm.public.Sponsor.where({ id: existingSponsor.id }).update({
        tierName,
        monthlyPriceInCents,
        isOneTime,
        isActive,
        avatarUrl: avatarUrl || existingSponsor.avatarUrl,
        userId: linkedUser ? linkedUser.id : existingSponsor.userId,
      });
      this.logger.log(`Updated sponsor ${githubUsername} (active: ${isActive})`);
    } else {
      await this.prisma.db.orm.public.Sponsor.create({
        githubUsername,
        githubUserId,
        avatarUrl,
        name: sponsor.name || sponsor.login,
        tierName,
        monthlyPriceInCents,
        isOneTime,
        isActive,
        userId: linkedUser ? linkedUser.id : null,
      });
      this.logger.log(`Created new sponsor ${githubUsername} (active: ${isActive})`);
    }

    return { status: "success", githubUsername, isActive };
  }

  async mockSponsor(data: MockSponsorshipInput) {
    const githubUsername = data.githubUsername.toLowerCase().trim().replace(/^@/, "");
    const linkedUser = await this.prisma.db.orm.public.User.first({ githubUsername });
    const existingSponsor = await this.prisma.db.orm.public.Sponsor.first({ githubUsername });

    const avatarUrl = data.avatarUrl || `https://github.com/${githubUsername}.png`;

    if (existingSponsor) {
      return await this.prisma.db.orm.public.Sponsor.where({ id: existingSponsor.id }).update({
        name: data.name ?? existingSponsor.name ?? githubUsername,
        avatarUrl,
        tierName: data.tierName,
        monthlyPriceInCents: data.monthlyPriceInCents,
        isOneTime: data.isOneTime,
        isActive: data.isActive,
        userId: linkedUser ? linkedUser.id : existingSponsor.userId,
      });
    }

    return await this.prisma.db.orm.public.Sponsor.create({
      githubUsername,
      name: data.name ?? githubUsername,
      avatarUrl,
      tierName: data.tierName,
      monthlyPriceInCents: data.monthlyPriceInCents,
      isOneTime: data.isOneTime,
      isActive: data.isActive,
      userId: linkedUser ? linkedUser.id : null,
    });
  }

  async clearMockSponsors() {
    const sponsors = await this.prisma.db.orm.public.Sponsor.all();
    for (const sponsor of sponsors) {
      await this.prisma.db.orm.public.Sponsor.where({ id: sponsor.id }).delete();
    }
    return { success: true, count: sponsors.length };
  }
}
