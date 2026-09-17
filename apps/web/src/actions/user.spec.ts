import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { changePasswordAction } from "./user";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("user actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("changePasswordAction", () => {
    it("should return error when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await changePasswordAction("new-secret-pwd");

      // Assert
      expect(result).toEqual({
        success: false,
        message: "User not authenticated",
      });
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return success true when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      // Act
      const result = await changePasswordAction("new-password-123");

      // Assert
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
          body: JSON.stringify({ password: "new-password-123" }),
        }
      );
    });
  });
});
