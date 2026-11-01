import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import {
  getCurriculumAction,
  getLessonAction,
  submitLessonProgressAction,
  submitLessonFeedbackAction,
  generateNextUnitAction,
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

    it("should include Authorization header when token is present for getLessonAction", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "jwt-token-lesson" }),
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
        expect.objectContaining({
          headers: {
            Authorization: "Bearer jwt-token-lesson",
          },
        })
      );
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

    it("should return false when upstream response is not ok", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
      });

      const result = await submitLessonProgressAction("les_1", {
        score: 50,
      });

      expect(result).toEqual({ success: false });
    });

    it("should return false and log error when fetch throws", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "valid-jwt" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

      const result = await submitLessonProgressAction("les_1", {
        score: 80,
      });

      expect(result).toEqual({ success: false });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error submitting lesson progress for les_1:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
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

    it("should return { success: false } when upstream response is not ok", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await submitLessonFeedbackAction("les_1", { rating: "helpful" });

      expect(result).toEqual({ success: false });
    });

    it("should include Authorization header when token is present in submitLessonFeedbackAction", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "jwt-token-feedback" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
      global.fetch = fetchMock;

      const result = await submitLessonFeedbackAction("les_1", { rating: "helpful" });

      expect(result).toEqual({ success: true });
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/lessons/les_1/feedback"),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer jwt-token-feedback",
          }),
        })
      );
    });

    it("should return { success: false } and log error when submitLessonFeedbackAction fetch throws", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("Feedback service error"));

      const result = await submitLessonFeedbackAction("les_1", { rating: "not_helpful" });

      expect(result).toEqual({ success: false });
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error submitting feedback for lesson les_1:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe("generateNextUnitAction", () => {
    it("should post default level N5 and include token header when available", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue({ value: "jwt-token-gen" }),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockTopics = [{ id: "top_gen", title: "Generated Topic" }];
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTopics),
      });
      global.fetch = fetchMock;

      const result = await generateNextUnitAction();

      expect(result).toEqual(mockTopics);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/curriculum/generate"),
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer jwt-token-gen",
          },
          body: JSON.stringify({ level: "N5" }),
        })
      );
    });

    it("should post level and return generated curriculum topics", async () => {
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      const mockTopics = [{ id: "top_new", title: "New Unit Topic" }];
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockTopics),
      });
      global.fetch = fetchMock;

      const result = await generateNextUnitAction("N1");

      expect(result).toEqual(mockTopics);
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/tutor/curriculum/generate"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ level: "N1" }),
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

      const result = await generateNextUnitAction("N1");

      expect(result).toEqual([]);
    });

    it("should return empty array and log error when generateNextUnitAction fetch throws", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const mockCookieStore = {
        get: vi.fn().mockReturnValue(undefined),
      };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as any);

      global.fetch = vi.fn().mockRejectedValue(new Error("AI generation failure"));

      const result = await generateNextUnitAction("N2");

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Error generating next unit for N2:",
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});

