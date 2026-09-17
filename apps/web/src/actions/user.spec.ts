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
  });
});
