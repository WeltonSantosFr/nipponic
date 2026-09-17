import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { changePasswordAction, deleteAccountAction } from "./user";

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

    it("should return error message from response when upstream request fails", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Password is too weak" }),
      });

      // Act
      const result = await changePasswordAction("123");

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Password is too weak",
      });
    });

    it("should return default error message when upstream error response json fails to parse", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      // Act
      const result = await changePasswordAction("123");

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Failed to update password",
      });
    });

    it("should return network error message and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Connection reset"));

      // Act
      const result = await changePasswordAction("secret123");

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Network error while updating password",
      });
      expect(consoleSpy).toHaveBeenCalledWith("Error changing password:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("deleteAccountAction", () => {
    it("should return error when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await deleteAccountAction();

      // Assert
      expect(result).toEqual({
        success: false,
        message: "User not authenticated",
      });
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return success true and delete token cookie when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
        delete: vi.fn(),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
      });

      // Act
      const result = await deleteAccountAction();

      // Assert
      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        {
          method: "DELETE",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
        }
      );
      expect(mockCookieStore.delete).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return error message when upstream request fails", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Account deletion forbidden" }),
      });

      // Act
      const result = await deleteAccountAction();

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Account deletion forbidden",
      });
    });

    it("should return network error message and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Connection reset"));

      // Act
      const result = await deleteAccountAction();

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Network error while deleting account",
      });
      expect(consoleSpy).toHaveBeenCalledWith("Error deleting account:", expect.any(Error));
      consoleSpy.mockRestore();
    });

    it("should return default error message when upstream error response json fails to parse", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      // Act
      const result = await deleteAccountAction();

      // Assert
      expect(result).toEqual({
        success: false,
        message: "Failed to delete account",
      });
    });
  });
});
