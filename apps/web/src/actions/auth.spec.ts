import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { saveAuthCookie } from "./auth";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("auth actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("saveAuthCookie", () => {
    it("should set the nipponic.token cookie with appropriate options", async () => {
      // Arrange
      const mockCookieStore = {
        set: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      await saveAuthCookie("my-test-jwt");

      // Assert
      expect(mockCookieStore.set).toHaveBeenCalledWith(
        "nipponic.token",
        "my-test-jwt",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 60 * 60 * 24 * 7,
          path: "/",
        }
      );
    });
  });
});
