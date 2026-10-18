import { describe, it, expect, vi, beforeEach } from "vitest";
import { TutorController } from "./tutor.controller";
import { TutorService } from "./tutor.service";
import type { Request } from "express";

describe("TutorController", () => {
  let controller: TutorController;
  let tutorServiceMock: TutorService;

  beforeEach(() => {
    tutorServiceMock = {
      getCurriculum: vi.fn(),
      getLessonByTopicId: vi.fn(),
      recordProgress: vi.fn(),
      submitFeedback: vi.fn(),
    } as unknown as TutorService;

    controller = new TutorController(tutorServiceMock);
  });

  it("getCurriculum should call tutorService.getCurriculum", async () => {
    const mockTopics = [{ id: "top_1", title: "Topic 1" }];
    vi.mocked(tutorServiceMock.getCurriculum).mockResolvedValue(
      mockTopics as any
    );

    const mockReq = { headers: {} } as Request;
    const result = await controller.getCurriculum("N5", mockReq);

    expect(result).toEqual(mockTopics);
    expect(tutorServiceMock.getCurriculum).toHaveBeenCalledWith("N5", undefined);
  });

  it("getLessonByTopic should call tutorService.getLessonByTopicId", async () => {
    const mockLesson = { id: "les_1", title: "Lesson 1" };
    vi.mocked(tutorServiceMock.getLessonByTopicId).mockResolvedValue(
      mockLesson as any
    );

    const mockReq = { headers: {} } as Request;
    const result = await controller.getLessonByTopic("top_1", mockReq);

    expect(result).toEqual(mockLesson);
    expect(tutorServiceMock.getLessonByTopicId).toHaveBeenCalledWith("top_1", undefined);
  });

  it("recordProgress should validate body and call tutorService.recordProgress", async () => {
    vi.mocked(tutorServiceMock.recordProgress).mockResolvedValue({
      success: true,
      score: 90,
    });

    const user = { sub: "usr_1", username: "tester", email: "tester@test.com" };
    const result = await controller.recordProgress("les_1", { score: 90 }, user);

    expect(result).toEqual({ success: true, score: 90 });
    expect(tutorServiceMock.recordProgress).toHaveBeenCalledWith("usr_1", "les_1", 90);
  });

  it("submitFeedback should call tutorService.submitFeedback", async () => {
    vi.mocked(tutorServiceMock.submitFeedback).mockResolvedValue({
      success: true,
    });

    const mockReq = { headers: {} } as Request;
    const result = await controller.submitFeedback(
      "les_1",
      { rating: "helpful", comment: "Clear explanation" },
      mockReq
    );

    expect(result).toEqual({ success: true });
    expect(tutorServiceMock.submitFeedback).toHaveBeenCalledWith(
      "les_1",
      "helpful",
      "Clear explanation",
      undefined
    );
  });
});
