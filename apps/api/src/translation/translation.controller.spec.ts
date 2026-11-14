import { describe, it, expect, beforeEach, vi } from "vitest";
import { TranslationController } from "./translation.controller";
import type { TranslationService } from "./translation.service";
import type { JwtService } from "@nestjs/jwt";
import type { Request } from "express";

describe("TranslationController", () => {
  let controller: TranslationController;
  let mockService: {
    getDailyState: ReturnType<typeof vi.fn>;
    submitAttempt: ReturnType<typeof vi.fn>;
    devUnlock: ReturnType<typeof vi.fn>;
  };
  let mockJwtService: {
    verifyAsync: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockService = {
      getDailyState: vi.fn(),
      submitAttempt: vi.fn(),
      devUnlock: vi.fn(),
    };
    mockJwtService = {
      verifyAsync: vi.fn(),
    };
    controller = new TranslationController(
      mockService as unknown as TranslationService,
      mockJwtService as unknown as JwtService,
    );
  });

  it("extracts userId from valid Bearer token on GET /translation/daily", async () => {
    mockJwtService.verifyAsync.mockResolvedValue({ sub: "usr-42" });
    mockService.getDailyState.mockResolvedValue({ totalPrompts: 4 });

    const req = {
      headers: { authorization: "Bearer valid.jwt.token" },
    } as unknown as Request;

    await controller.getDailyState(req, "2026-11-12");

    expect(mockService.getDailyState).toHaveBeenCalledWith(
      "usr-42",
      "2026-11-12",
    );
  });

  it("falls back to guest (undefined userId) when token is missing or invalid", async () => {
    mockJwtService.verifyAsync.mockRejectedValue(new Error("invalid token"));
    mockService.getDailyState.mockResolvedValue({ totalPrompts: 4 });

    const req = {
      headers: { authorization: "Bearer bad.token" },
    } as unknown as Request;

    await controller.getDailyState(req, "2026-11-12");

    expect(mockService.getDailyState).toHaveBeenCalledWith(
      undefined,
      "2026-11-12",
    );
  });

  it("delegates POST /translation/submit with authenticated user sub", async () => {
    mockService.submitAttempt.mockResolvedValue({ isCorrect: true });

    await controller.submitAttempt(
      { sub: "usr-42", username: "kenji", email: "kenji@example.com" },
      { promptId: "mvp-1-jp-en", answer: "Water please", localDate: "2026-11-12" },
    );

    expect(mockService.submitAttempt).toHaveBeenCalledWith("usr-42", {
      promptId: "mvp-1-jp-en",
      answer: "Water please",
      localDate: "2026-11-12",
    });
  });

  it("delegates POST /translation/dev-unlock with authenticated user sub", async () => {
    mockService.devUnlock.mockResolvedValue({ isLockedToday: false });

    await controller.devUnlock(
      { sub: "usr-42", username: "kenji", email: "kenji@example.com" },
      { resetAll: false },
      "2026-11-12",
    );

    expect(mockService.devUnlock).toHaveBeenCalledWith(
      "usr-42",
      { resetAll: false },
      "2026-11-12",
    );
  });
});
