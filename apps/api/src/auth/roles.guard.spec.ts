import { describe, it, expect, beforeEach, vi } from "vitest";
import { RolesGuard } from "./roles.guard";
import { Reflector } from "@nestjs/core";
import { ForbiddenException, type ExecutionContext } from "@nestjs/common";
import type { JwtPayload } from "@nipponic/shared";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user?: Partial<JwtPayload>): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it("should allow access if no roles are required", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
    const ctx = createMockContext();
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it("should throw ForbiddenException if user is missing", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"]);
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("should throw ForbiddenException if user does not have required role", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"]);
    const ctx = createMockContext({ role: "USER" });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("should allow access if user has required role", () => {
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(["ADMIN"]);
    const ctx = createMockContext({ role: "ADMIN" });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
