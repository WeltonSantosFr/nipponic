import { describe, it, expect } from "vitest";
import { AuthController } from "../auth/auth.controller";
import { UsersController } from "../user/users.controller";
import { TutorController } from "../tutor/tutor.controller";
import { SponsorsController } from "../sponsors/sponsors.controller";

// @nestjs/throttler stores per-route overrides as `THROTTLER:LIMITdefault` / `THROTTLER:TTLdefault`
const limitOf = (fn: object) => Reflect.getMetadata("THROTTLER:LIMITdefault", fn);
const ttlOf = (fn: object) => Reflect.getMetadata("THROTTLER:TTLdefault", fn);
const skipped = (fn: object) => Reflect.getMetadata("THROTTLER:SKIPdefault", fn);

describe("route-level rate limits", () => {
  it("login is limited to 5 attempts per minute", () => {
    expect(limitOf(AuthController.prototype.login)).toBe(5);
    expect(ttlOf(AuthController.prototype.login)).toBe(60_000);
  });

  it("sign-up is limited to 5 per minute", () => {
    expect(limitOf(UsersController.prototype.create)).toBe(5);
  });

  it("Gemini-backed curriculum generation is limited to 5 per minute", () => {
    expect(limitOf(TutorController.prototype.generateNextUnit)).toBe(5);
  });

  it("the signed webhook skips the per-IP limit", () => {
    expect(skipped(SponsorsController.prototype.handleWebhook)).toBe(true);
  });
});
