import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import {
  getDecksAction,
  getPublicDecksAction,
  getDeckAction,
  createDeckAction,
  updateDeckAction,
  deleteDeckAction,
  addCardsToDeckAction,
} from "./decks";

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

    it("should return decks when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockDecks = [
        { id: "deck-1", name: "JLPT N5", isPublic: true },
        { id: "deck-2", name: "JLPT N4", isPublic: false },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDecks),
      });

      // Act
      const result = await getDecksAction();

      // Assert
      expect(result).toEqual(mockDecks);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/decks"),
        {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
          cache: "no-store",
        }
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
      const result = await getDecksAction();

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

      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      // Act
      const result = await getDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching decks:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("getPublicDecksAction", () => {
    it("should return empty array when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getPublicDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return public decks when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockPublicDecks = [
        { id: "pub-1", name: "JLPT N5 Public", isPublic: true },
      ];

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockPublicDecks),
      });

      // Act
      const result = await getPublicDecksAction();

      // Assert
      expect(result).toEqual(mockPublicDecks);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/decks/public"),
        {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
          cache: "no-store",
        }
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
        status: 403,
      });

      // Act
      const result = await getPublicDecksAction();

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

      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      // Act
      const result = await getPublicDecksAction();

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching public decks:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("getDeckAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getDeckAction("deck-123");

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return deck when token is present and fetch succeeds", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockDeck = {
        id: "deck-123",
        name: "Kanji N3",
        isPublic: false,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDeck),
      });

      // Act
      const result = await getDeckAction("deck-123");

      // Assert
      expect(result).toEqual(mockDeck);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/decks/deck-123"),
        {
          method: "GET",
          headers: {
            Authorization: "Bearer valid-jwt-token",
          },
          cache: "no-store",
        }
      );
    });

    it("should return null when upstream fetch fails with non-ok status", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });

      // Act
      const result = await getDeckAction("deck-123");

      // Assert
      expect(result).toBeNull();
    });

    it("should return null and log error when upstream fetch throws an error", async () => {
      // Arrange
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      // Act
      const result = await getDeckAction("deck-123");

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching deck:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("createDeckAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await createDeckAction({ name: "New Deck", isPublic: false } as any);

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should successfully create deck and return data when response is ok", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockDeck = { id: "deck-123", name: "New Deck", isPublic: false };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDeck),
      } as any);

      const input = { name: "New Deck", isPublic: false };

      // Act
      const result = await createDeckAction(input as any);

      // Assert
      expect(result).toEqual(mockDeck);
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/decks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify(input),
      });
    });

    it("should return null when response is not ok", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as any);

      // Act
      const result = await createDeckAction({ name: "New Deck", isPublic: false } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to create deck, status:", 500);
      consoleSpy.mockRestore();
    });

    it("should return null and log error when upstream fetch throws an error", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(global.fetch).mockRejectedValue(new Error("Network failure"));

      // Act
      const result = await createDeckAction({ name: "New Deck", isPublic: false } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error creating deck:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("updateDeckAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await updateDeckAction("deck-123", { name: "Updated Deck" } as any);

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should successfully update deck and return data when response is ok", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockDeck = { id: "deck-123", name: "Updated Deck", isPublic: true };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDeck),
      } as any);

      const input = { name: "Updated Deck", isPublic: true };

      // Act
      const result = await updateDeckAction("deck-123", input as any);

      // Assert
      expect(result).toEqual(mockDeck);
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/decks/deck-123", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify(input),
      });
    });

    it("should return null when response is not ok", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 400,
      } as any);

      // Act
      const result = await updateDeckAction("deck-123", { name: "Updated Deck" } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to update deck, status:", 400);
      consoleSpy.mockRestore();
    });

    it("should return null and log error when upstream fetch throws an error", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(global.fetch).mockRejectedValue(new Error("Update failed"));

      // Act
      const result = await updateDeckAction("deck-123", { name: "Updated Deck" } as any);

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Error updating deck:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("deleteDeckAction", () => {
    it("should return false when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await deleteDeckAction("deck-123");

      // Assert
      expect(result).toBe(false);
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return true when delete request succeeds with ok status", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
      } as any);

      // Act
      const result = await deleteDeckAction("deck-123");

      // Assert
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/decks/deck-123", {
        method: "DELETE",
        headers: {
          Authorization: "Bearer test-token",
        },
      });
    });

    it("should return false and log error when upstream fetch throws an error", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.mocked(global.fetch).mockRejectedValue(new Error("Delete failed"));

      // Act
      const result = await deleteDeckAction("deck-123");

      // Assert
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("Error deleting deck:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("addCardsToDeckAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await addCardsToDeckAction("deck-123", ["card-1", "card-2"]);

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should successfully add cards to deck and return data when response is ok", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "test-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockDeck = { id: "deck-123", name: "Deck", cards: [{ id: "c1" }, { id: "c2" }] };
      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockDeck),
      } as any);

      // Act
      const result = await addCardsToDeckAction("deck-123", ["c1", "c2"]);

      // Assert
      expect(result).toEqual(mockDeck);
      expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/decks/deck-123/cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-token",
        },
        body: JSON.stringify({ cardIds: ["c1", "c2"] }),
      });
    });
  });
});
