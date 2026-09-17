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
  });
});
