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

    it("should return cards when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCards = [
        { id: "crd_1", jpText: "日本語", enText: "Japanese", interval: 1, easeFactor: 2.5, repetitions: 1, lapses: 0 },
      ];
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockCards),
      });
      global.fetch = fetchMock;

      // Act
      const result = await getCardsAction();

      // Assert
      expect(result).toEqual(mockCards);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/cards"),
        expect.objectContaining({
          method: "GET",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
        })
      );
    });

    it("should return empty array when upstream fetch fails with non-ok status", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Act
      const result = await getCardsAction();

      // Assert
      expect(result).toEqual([]);
    });
  });
});
