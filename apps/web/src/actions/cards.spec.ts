import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getCardsAction, createCardAction, updateCardAction, reviewCardAction } from "./cards";

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

    it("should return null and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));

      // Act
      const result = await createCardAction({ front: "犬", back: "Dog" } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error creating card:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("updateCardAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await updateCardAction("card-123", { front: "更新" } as any);

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return updated card when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const updateInput = { front: "日本語 (updated)" };
      const mockUpdatedCard = {
        id: "card-123",
        front: "日本語 (updated)",
        back: "Japanese",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockUpdatedCard),
      });

      // Act
      const result = await updateCardAction("card-123", updateInput as any);

      // Assert
      expect(result).toEqual(mockUpdatedCard);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/cards/card-123"),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
          body: JSON.stringify(updateInput),
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
        status: 404,
      });

      // Act
      const result = await updateCardAction("card-123", { front: "更新" } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to update card, status:", 404);
      consoleSpy.mockRestore();
    });

    it("should return null and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));

      // Act
      const result = await updateCardAction("card-123", { front: "更新" } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error updating card:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("reviewCardAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await reviewCardAction("card-123", "GOOD" as any);

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return reviewed card when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockReviewedCard = {
        id: "card-123",
        interval: 2,
        repetition: 1,
        easeFactor: 2.6,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockReviewedCard),
      });

      // Act
      const result = await reviewCardAction("card-123", "GOOD" as any);

      // Assert
      expect(result).toEqual(mockReviewedCard);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/cards/card-123/review"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
          body: JSON.stringify({ rating: "GOOD" }),
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
      const result = await reviewCardAction("card-123", "AGAIN" as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to review card, status:", 400);
      consoleSpy.mockRestore();
    });

    it("should return null and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network disconnect"));

      // Act
      const result = await reviewCardAction("card-123", "EASY" as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error reviewing card:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});
