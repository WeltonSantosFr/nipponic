import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getDecksAction } from "./decks";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("decks actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getDecksAction", () => {
    it("should return empty array when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });
  });
});
