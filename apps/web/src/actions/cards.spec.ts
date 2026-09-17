import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getCardsAction, createCardAction } from "./cards";

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

    it("should return empty array and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));

      // Act
      const result = await getCardsAction();

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching cards:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("createCardAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await createCardAction({
        front: "日本語",
        back: "Japanese",
      } as any);

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return created card when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const inputCard = {
        front: "日本語",
        back: "Japanese",
        deckId: "deck-1",
      };

      const mockCreatedCard = {
        id: "card-123",
        ...inputCard,
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockCreatedCard),
      });

      // Act
      const result = await createCardAction(inputCard as any);

      // Assert
      expect(result).toEqual(mockCreatedCard);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/cards"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
          body: JSON.stringify(inputCard),
        }
      );
    });

    it("should return null and log error when upstream fetch fails with non-ok status", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      // Act
      const result = await createCardAction({ front: "犬", back: "Dog" } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to create card, status:", 400);
      consoleSpy.mockRestore();
    });
  });
});
