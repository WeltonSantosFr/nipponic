import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getNotesAction, createNoteAction } from "./notes";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("notes actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getNotesAction", () => {
    it("should return an empty array when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await getNotesAction();

      // Assert
      expect(result).toEqual([]);
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should return notes when token is present and fetch succeeds", async () => {
      // Arrange
      const mockNotes = [
        { id: "note_1", title: "Kanji Notes", content: "Learn N5 kanji", userId: "user_1" },
      ];
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNotes),
      });
      global.fetch = fetchMock;

      // Act
      const result = await getNotesAction();

      // Assert
      expect(result).toEqual(mockNotes);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/notes"),
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
      const result = await getNotesAction();

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
      const result = await getNotesAction();

      // Assert
      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith("Error fetching notes:", expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe("createNoteAction", () => {
    it("should return null when authentication token cookie is missing", async () => {
      // Arrange
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      // Act
      const result = await createNoteAction({ title: "New Note", content: "Content" });

      // Assert
      expect(result).toBeNull();
      expect(mockCookieStore.get).toHaveBeenCalledWith("nipponic.token");
    });

    it("should send POST request and return created note on success", async () => {
      // Arrange
      const noteInput = { title: "Kanji Note", content: "Learn N4" };
      const createdNote = { id: "note_123", ...noteInput, userId: "user_1" };
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt-token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(createdNote),
      });
      global.fetch = fetchMock;

      // Act
      const result = await createNoteAction(noteInput);

      // Assert
      expect(result).toEqual(createdNote);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/notes"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer valid-jwt-token",
          },
          body: JSON.stringify(noteInput),
        })
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
      const result = await createNoteAction({ title: "Bad Note", content: "" });

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith("Failed to create note, status:", 400);
      consoleSpy.mockRestore();
    });
  });
});
