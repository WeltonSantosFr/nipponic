import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { GUARDS_METADATA } from "@nestjs/common/constants";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import * as crypto from "node:crypto";
import { SponsorsController, isMockSponsorsEnabled } from "./sponsors.controller";
import { SponsorsService } from "./sponsors.service";
import { AuthGuard } from "../auth/auth.guard";

const SECRET = "whsec_test_secret";
const sign = (raw: Buffer) => `sha256=${crypto.createHmac("sha256", SECRET).update(raw).digest("hex")}`;

const payload = {
  action: "created",
  sponsorship: {
    sponsor: { login: "Fan", id: 1, avatar_url: "https://github.com/fan.png" },
    tier: { name: "Bento", monthly_price_in_cents: 300, is_one_time: false },
  },
};
const rawOf = (body: unknown) => Buffer.from(JSON.stringify(body));
const reqOf = (raw?: Buffer) => ({ rawBody: raw }) as unknown as RawBodyRequest<Request>;

describe("SponsorsController security", () => {
  let service: SponsorsService;
  let controller: SponsorsController;
  const env = { ...process.env };

  beforeEach(() => {
    process.env.GITHUB_SPONSORS_WEBHOOK_SECRET = SECRET;
    service = new SponsorsService({} as never);
    vi.spyOn(service, "handleWebhook").mockResolvedValue({ status: "success" } as never);
    controller = new SponsorsController(service);
  });

  afterEach(() => {
    process.env = { ...env };
    vi.restoreAllMocks();
  });

  describe("webhook", () => {
    it("rejects with 503 when the secret is not configured (fails closed)", async () => {
      delete process.env.GITHUB_SPONSORS_WEBHOOK_SECRET;
      const raw = rawOf(payload);
      await expect(controller.handleWebhook(sign(raw), "d1", payload, reqOf(raw))).rejects.toBeInstanceOf(
        ServiceUnavailableException,
      );
      expect(service.handleWebhook).not.toHaveBeenCalled();
    });

    it("rejects a missing signature", async () => {
      const raw = rawOf(payload);
      await expect(controller.handleWebhook(undefined, "d1", payload, reqOf(raw))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects an invalid or wrong-length signature without throwing from timingSafeEqual", async () => {
      const raw = rawOf(payload);
      await expect(controller.handleWebhook("sha256=abc", "d1", payload, reqOf(raw))).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it("rejects a valid signature computed over a different body (tampering)", async () => {
      const raw = rawOf(payload);
      const tampered = rawOf({ ...payload, action: "cancelled" });
      await expect(
        controller.handleWebhook(sign(raw), "d1", JSON.parse(tampered.toString()), reqOf(tampered)),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it("rejects when the raw body is unavailable instead of re-serializing the parsed body", async () => {
      await expect(controller.handleWebhook(sign(rawOf(payload)), "d1", payload, reqOf(undefined))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("accepts a correctly signed payload", async () => {
      const raw = rawOf(payload);
      const res = await controller.handleWebhook(sign(raw), "d1", payload, reqOf(raw));
      expect(res).toEqual({ status: "success" });
      expect(service.handleWebhook).toHaveBeenCalledTimes(1);
    });

    it("rejects a malformed (but correctly signed) payload with 400", async () => {
      const bad = { sponsorship: { sponsor: { login: 123 } } };
      const raw = rawOf(bad);
      await expect(controller.handleWebhook(sign(raw), "d2", bad, reqOf(raw))).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it("ignores a replayed delivery (idempotency)", async () => {
      const raw = rawOf(payload);
      await controller.handleWebhook(sign(raw), "same-delivery", payload, reqOf(raw));
      const second = await controller.handleWebhook(sign(raw), "same-delivery", payload, reqOf(raw));
      expect(second).toEqual({ status: "duplicate" });
      expect(service.handleWebhook).toHaveBeenCalledTimes(1);
    });
  });

  describe("mock endpoints", () => {
    it.each(["mockSponsor", "clearMockSponsors"] as const)("%s requires AuthGuard", (method) => {
      expect(Reflect.getMetadata(GUARDS_METADATA, SponsorsController.prototype[method])).toContain(AuthGuard);
    });

    it("return 404 when ENABLE_MOCK_SPONSORS is not set", () => {
      delete process.env.ENABLE_MOCK_SPONSORS;
      process.env.NODE_ENV = "development";
      expect(() => controller.clearMockSponsors()).toThrow(NotFoundException);
      expect(() => controller.mockSponsor({ githubUsername: "x" })).toThrow(NotFoundException);
    });

    it("return 404 in production even if the flag is set", () => {
      process.env.ENABLE_MOCK_SPONSORS = "true";
      process.env.NODE_ENV = "production";
      expect(isMockSponsorsEnabled()).toBe(false);
      expect(() => controller.clearMockSponsors()).toThrow(NotFoundException);
    });

    it("work only when enabled outside production, and validate input", async () => {
      process.env.ENABLE_MOCK_SPONSORS = "true";
      process.env.NODE_ENV = "development";
      vi.spyOn(service, "mockSponsor").mockResolvedValue({ id: "sp_1" } as never);
      vi.spyOn(service, "clearMockSponsors").mockResolvedValue({ success: true, count: 0 });

      expect(() => controller.mockSponsor({ githubUsername: "" })).toThrow(BadRequestException);
      await expect(controller.mockSponsor({ githubUsername: "fan" })).resolves.toEqual({ id: "sp_1" });
      await expect(controller.clearMockSponsors()).resolves.toEqual({ success: true, count: 0 });
    });
  });
});
