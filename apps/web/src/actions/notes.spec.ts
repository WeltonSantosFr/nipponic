import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import { getNotesAction } from "./notes";

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
  });
});
