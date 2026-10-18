import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import {
  getCurriculumAction,
  getLessonAction,
  submitLessonProgressAction,
  submitLessonFeedbackAction,
} from "./tutor";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("tutor actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCurriculumAction", () => {
    it("should fetch curriculum without token for guests", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockTopics = [{ id: "top_1", title: "Topic 1" }];
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTopics),
      });
      global.fetch = fetchMock;

      const result = await getCurriculumAction("N5");

      expect(result).toEqual(mockTopics);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/curriculum?level=N5"),
        expect.objectContaining({
          method: "GET",
          headers: {},
        })
      );
    });

    it("should include Authorization header when token is present", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockTopics = [{ id: "top_1", title: "Topic 1" }];
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTopics),
      });
      global.fetch = fetchMock;

      const result = await getCurriculumAction("N5");

      expect(result).toEqual(mockTopics);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/curriculum?level=N5"),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer valid-jwt",
          },
        })
      );
    });

    it("should return empty array on failure", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });
      global.fetch = fetchMock;

      const result = await getCurriculumAction("N5");

      expect(result).toEqual([]);
    });
  });

  describe("getLessonAction", () => {
    it("should fetch lesson for topic", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockLesson = { id: "les_1", title: "Lesson 1" };
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockLesson),
      });
      global.fetch = fetchMock;

      const result = await getLessonAction("top_1");

      expect(result).toEqual(mockLesson);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/topics/top_1/lesson"),
        expect.any(Object)
      );
    });

    it("should return null on failure", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      });
      global.fetch = fetchMock;

      const result = await getLessonAction("top_missing");

      expect(result).toBeNull();
    });
  });

  describe("submitLessonProgressAction", () => {
    it("should return false if token is missing", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const result = await submitLessonProgressAction("les_1", { score: 100 });

      expect(result).toEqual({ success: false });
    });

    it("should post progress with token when user is authenticated", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "jwt_token" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, score: 100 }),
      });
      global.fetch = fetchMock;

      const result = await submitLessonProgressAction("les_1", { score: 100 });

      expect(result).toEqual({ success: true, score: 100 });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/lessons/les_1/progress"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer jwt_token",
          },
          body: JSON.stringify({ score: 100 }),
        })
      );
    });
  });

  describe("submitLessonFeedbackAction", () => {
    it("should post feedback and return success", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = fetchMock;

      const result = await submitLessonFeedbackAction("les_1", {
        rating: "helpful",
      });

      expect(result).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/lessons/les_1/feedback"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ rating: "helpful" }),
        })
      );
    });
  });
});
