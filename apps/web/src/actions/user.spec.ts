import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import {
  changePasswordAction,
  deleteAccountAction,
  getUserProfileAction,
  updateGithubUsernameAction,
} from "./user";

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

  describe("getUserProfileAction", () => {
    it("should return null when token cookie is missing", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await getUserProfileAction();

      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return user object when authenticated and upstream request succeeds", async () => {
      const mockUser = {
        id: "usr_123",
        email: "test@nipponic.com",
        githubUsername: "octocat",
      };
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUser),
      });

      const result = await getUserProfileAction();

      expect(result).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
          cache: "no-store",
        }
      );
    });

    it("should return null when upstream response is not ok", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const result = await getUserProfileAction();

      expect(result).toBeNull();
    });

    it("should log error and return null when fetch throws", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network connection lost"));

      const result = await getUserProfileAction();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching user profile:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("updateGithubUsernameAction", () => {
    it("should return error when token cookie is missing", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await updateGithubUsernameAction("octocat");

      expect(result).toEqual({
        success: false,
        message: "User not authenticated",
      });
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return success and updated user data when patch succeeds", async () => {
      const mockUpdatedUser = {
        id: "usr_123",
        email: "test@nipponic.com",
        githubUsername: "new-octocat",
      };
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUpdatedUser),
      });

      const result = await updateGithubUsernameAction("new-octocat");

      expect(result).toEqual({
        success: true,
        user: mockUpdatedUser,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/users/me"),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
          body: JSON.stringify({ githubUsername: "new-octocat" }),
        }
      );
    });

    it("should return error message when upstream returns error with message", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue({ message: "GitHub username already in use" }),
      });

      const result = await updateGithubUsernameAction("octocat");

      expect(result).toEqual({
        success: false,
        message: "GitHub username already in use",
      });
    });

    it("should return fallback error message when upstream returns error with invalid JSON", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      const result = await updateGithubUsernameAction("octocat");

      expect(result).toEqual({
        success: false,
        message: "Failed to update GitHub username",
      });
    });

    it("should return network error message and log error when fetch throws", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Timeout"));

      const result = await updateGithubUsernameAction("octocat");

      expect(result).toEqual({
        success: false,
        message: "Network error while updating GitHub username",
      });
      expect(consoleSpy).toHaveBeenCalledWith("Error updating GitHub username:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
