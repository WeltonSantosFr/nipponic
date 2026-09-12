import { afterEach, describe, expect, it, vi } from "vitest";
import { createNote, fetchNotes, login } from "./api";

describe("api service", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("login", () => {
    it("should send credentials and return auth response on successful login", async () => {
      // Arrange
      const mockResponse = { access_token: "mock-jwt-token" };
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      // Act
      const result = await login({ email: "user@test.com", password: "password123" });

      // Assert
      expect(fetchSpy).toHaveBeenCalledWith("http://localhost:3001/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "user@test.com", password: "password123" }),
      });
      expect(result).toEqual(mockResponse);
    });

    it("should throw 'Authentication failed' error when response is not ok", async () => {
      // Arrange
      vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      // Act & Assert
      await expect(login({ email: "wrong@test.com", password: "wrong" })).rejects.toThrow(
        "Authentication failed"
      );
    });
  });

  describe("fetchNotes", () => {
    it("should fetch notes with authorization header and return notes array", async () => {
      // Arrange
      const mockNotes = [
        { id: "note-1", title: "Test Note", enText: "Hello", jpText: "こんにちは" },
      ];
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockNotes,
      } as Response);

      // Act
      const result = await fetchNotes("my-secret-token");

      // Assert
      expect(fetchSpy).toHaveBeenCalledWith("http://localhost:3001/notes", {
        method: "GET",
        headers: {
          Authorization: "Bearer my-secret-token",
        },
      });
      expect(result).toEqual(mockNotes);
    });

    it("should catch fetch errors and log them via console.error", async () => {
      // Arrange
      const networkError = new Error("Network failure");
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(networkError);
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Act
      const result = await fetchNotes("my-secret-token");

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(networkError);
      expect(result).toBeUndefined();
    });
  });

  describe("createNote", () => {
    it("should send note data with authorization header and return created note", async () => {
      // Arrange
      const noteData = { enText: "Hello world", jpText: "こんにちは世界" };
      const mockCreatedNote = {
        id: "note-new",
        ...noteData,
        createdAt: "2026-01-01T00:00:00.000Z",
      };
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
        ok: true,
        json: async () => mockCreatedNote,
      } as Response);

      // Act
      const result = await createNote("my-secret-token", noteData as any);

      // Assert
      expect(fetchSpy).toHaveBeenCalledWith("http://localhost:3001/notes", {
        method: "POST",
        headers: {
          Authorization: "Bearer my-secret-token",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noteData),
      });
      expect(result).toEqual(mockCreatedNote);
    });

    it("should catch fetch errors and log them via console.error", async () => {
      // Arrange
      const networkError = new Error("Network failure");
      vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(networkError);
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Act
      const result = await createNote("my-secret-token", { enText: "x", jpText: "y" } as any);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(networkError);
      expect(result).toBeUndefined();
    });
  });
});
