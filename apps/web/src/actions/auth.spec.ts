import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cookies } from "next/headers";
import { validateSessionAction, saveAuthCookie, removeAuthCookie } from "./auth";

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("saveAuthCookie", () => {
    it("should set nipponic.token cookie with httpOnly and 7 days maxAge", async () => {
      await saveAuthCookie("test-token-123");

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "nipponic.token",
        "test-token-123",
        expect.objectContaining({
          httpOnly: true,
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        })
      );
    });
  });

  describe("removeAuthCookie", () => {
    it("should delete nipponic.token cookie", async () => {
      await removeAuthCookie();

      expect(mockCookieStore.delete).toHaveBeenCalledWith("nipponic.token");
    });
  });

  describe("validateSessionAction", () => {
    it("should return no_token if cookie is absent", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await validateSessionAction();

      expect(result).toEqual({ status: "no_token" });
    });

    it("should return valid and user if API responds 200", async () => {
      mockCookieStore.get.mockReturnValue({ value: "valid-jwt-token" });

      const mockUser = {
        sub: "user-1",
        email: "test@example.com",
        username: "testuser",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockUser),
      });

      const result = await validateSessionAction();

      expect(result).toEqual({
        status: "valid",
        user: mockUser,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
        })
      );
    });

    it("should delete cookie and return invalid when API returns 401", async () => {
      mockCookieStore.get.mockReturnValue({ value: "expired-jwt-token" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await validateSessionAction();

      expect(result).toEqual({
        status: "invalid",
        reason: "Token expired or invalid",
      });
      expect(mockCookieStore.delete).toHaveBeenCalledWith("nipponic.token");
    });

    it("should delete cookie and return invalid when API returns 403", async () => {
      mockCookieStore.get.mockReturnValue({ value: "forbidden-jwt-token" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
      });

      const result = await validateSessionAction();

      expect(result).toEqual({
        status: "invalid",
        reason: "Token expired or invalid",
      });
      expect(mockCookieStore.delete).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return error on unexpected status codes without deleting cookie", async () => {
      mockCookieStore.get.mockReturnValue({ value: "some-token" });

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await validateSessionAction();

      expect(result).toEqual({
        status: "error",
        message: "Unexpected status code: 500",
      });
      expect(mockCookieStore.delete).not.toHaveBeenCalled();
    });

    it("should return error on network failure", async () => {
      mockCookieStore.get.mockReturnValue({ value: "some-token" });

      global.fetch = vi.fn().mockRejectedValue(new Error("Connection refused"));

      const result = await validateSessionAction();

      expect(result).toEqual({
        status: "error",
        message: "Network error",
      });
    });
  });
});
