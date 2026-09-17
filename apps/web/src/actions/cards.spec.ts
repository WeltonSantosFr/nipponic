import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getCardsAction } from "./cards";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("cards actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCardsAction", () => {
    it("should return an empty array when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getCardsAction();

      // Assert
      expect(result).toEqual([]);
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });
  });
});
