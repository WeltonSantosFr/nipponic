import { describe, it, expect, vi, beforeEach } from "vitest";
import { TutorService } from "./tutor.service";
import { GeminiService } from "./gemini.service";
import { PrismaService } from "../prisma.service";
import { NotFoundException } from "@nestjs/common";

describe("TutorService", () => {
  let service: TutorService;
  let prismaMock: any;
  let geminiServiceMock: GeminiService;

  beforeEach(() => {
    prismaMock = {
      db: {
        orm: {
          public: {
            CurriculumTopic: {
              first: vi.fn(),
              create: vi.fn(),
              where: vi.fn(),
            },
            Lesson: {
              first: vi.fn(),
              create: vi.fn(),
              where: vi.fn(),
            },
            LessonExercise: {
              create: vi.fn(),
              where: vi.fn(),
            },
            UserLessonProgress: {
              first: vi.fn(),
              create: vi.fn(),
              where: vi.fn(),
            },
            LessonFeedback: {
              create: vi.fn(),
            },
          },
        },
      },
    };

    geminiServiceMock = {
      generateLesson: vi.fn(),
      generateCurriculumUnit: vi.fn(),
    } as unknown as GeminiService;

    service = new TutorService(
      prismaMock as unknown as PrismaService,
      geminiServiceMock
    );
  });

  describe("getCurriculum", () => {
    it("should return topics sorted by unit and lesson index", async () => {
      const mockTopics = [
        {
          id: "top_2",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Unit 1",
          lessonIndex: 2,
          title: "Lesson 2",
          grammarKey: "key-2",
          objective: "Obj 2",
        },
        {
          id: "top_1",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Unit 1",
          lessonIndex: 1,
          title: "Lesson 1",
          grammarKey: "key-1",
          objective: "Obj 1",
        },
      ];

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        all: vi.fn().mockResolvedValue(mockTopics),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([{ id: "les_1", topicId: "top_1" }]),
      });

      const result = await service.getCurriculum("N5");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("top_1");
      expect(result[0].hasLesson).toBe(true);
      expect(result[1].id).toBe("top_2");
      expect(result[1].hasLesson).toBe(false);
    });

    it("should attach completion status when userId is provided", async () => {
      const mockTopics = [
        {
          id: "top_1",
          level: "N5",
          unitIndex: 1,
          unitTitle: "Unit 1",
          lessonIndex: 1,
          title: "Lesson 1",
          grammarKey: "key-1",
          objective: "Obj 1",
        },
      ];

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        all: vi.fn().mockResolvedValue(mockTopics),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([{ id: "les_1", topicId: "top_1" }]),
      });

      prismaMock.db.orm.public.UserLessonProgress.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          { lessonId: "les_1", completedAt: new Date(), score: 100 },
        ]),
      });

      const result = await service.getCurriculum("N5", "usr_123");

      expect(result[0].isCompleted).toBe(true);
      expect(result[0].completedScore).toBe(100);
    });
  });

  describe("getLessonByTopicId", () => {
    it("CACHE HIT: should return existing lesson without calling Gemini (0 tokens)", async () => {
      const mockTopic = {
        id: "top_1",
        level: "N5",
        title: "Topic 1",
        grammarKey: "key-1",
        objective: "Obj 1",
      };

      const mockLesson = {
        id: "les_1",
        topicId: "top_1",
        title: "Topic 1",
        level: "N5",
        theoryMarkdown: "# Theory",
        dialogueJson: [{ speaker: "A", jpText: "こんにちは", enText: "Hello" }],
        vocabularyJson: [{ jpText: "日", reading: "ひ", enText: "Sun" }],
        createdAt: new Date(),
      };

      const mockExercises = [
        {
          id: "ex_1",
          order: 1,
          type: "multiple_choice",
          prompt: "Choose answer",
          optionsJson: ["A", "B"],
          correctAnswer: "A",
          explanation: "Because A",
        },
      ];

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockLesson),
      });

      prismaMock.db.orm.public.LessonExercise.where.mockReturnValue({
        all: vi.fn().mockResolvedValue(mockExercises),
      });

      const result = await service.getLessonByTopicId("top_1");

      expect(result.id).toBe("les_1");
      expect(result.dialogue).toHaveLength(1);
      expect(result.exercises).toHaveLength(1);
      expect(geminiServiceMock.generateLesson).not.toHaveBeenCalled();
    });

    it("CACHE MISS: should generate lesson via Gemini, save to DB, and return it", async () => {
      const mockTopic = {
        id: "top_2",
        level: "N5",
        title: "Topic 2",
        grammarKey: "key-2",
        objective: "Obj 2",
      };

      const mockGenerated = {
        title: "Generated Lesson 2",
        theoryMarkdown: "### Theory 2",
        dialogue: [{ speaker: "A", jpText: "はい", enText: "Yes" }],
        vocabulary: [{ jpText: "はい", reading: "はい", enText: "Yes" }],
        exercises: [
          {
            order: 1,
            type: "multiple_choice" as const,
            prompt: "Question 1",
            options: ["A", "B"],
            correctAnswer: "A",
            explanation: "Explanation",
          },
        ],
      };

      const mockSavedLesson = {
        id: "les_new",
        topicId: "top_2",
        title: "Generated Lesson 2",
        level: "N5",
        theoryMarkdown: "### Theory 2",
        dialogueJson: mockGenerated.dialogue,
        vocabularyJson: mockGenerated.vocabulary,
        createdAt: new Date(),
      };

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });

      prismaMock.db.orm.public.Lesson.create.mockResolvedValue(mockSavedLesson);
      prismaMock.db.orm.public.LessonExercise.create.mockResolvedValue({ id: "ex_new" });

      prismaMock.db.orm.public.LessonExercise.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          {
            id: "ex_new",
            order: 1,
            type: "multiple_choice",
            prompt: "Question 1",
            optionsJson: ["A", "B"],
            correctAnswer: "A",
            explanation: "Explanation",
          },
        ]),
      });

      vi.mocked(geminiServiceMock.generateLesson).mockResolvedValue(mockGenerated);

      const result = await service.getLessonByTopicId("top_2");

      expect(geminiServiceMock.generateLesson).toHaveBeenCalledWith({
        title: "Topic 2",
        level: "N5",
        grammarKey: "key-2",
        objective: "Obj 2",
      });
      expect(prismaMock.db.orm.public.Lesson.create).toHaveBeenCalled();
      expect(result.id).toBe("les_new");
      expect(result.exercises).toHaveLength(1);
    });

    it("should throw NotFoundException if topic does not exist", async () => {
      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });

      await expect(service.getLessonByTopicId("unknown")).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe("recordProgress", () => {
    it("should record user lesson progress", async () => {
      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: "les_1" }),
      });

      prismaMock.db.orm.public.UserLessonProgress.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });

      prismaMock.db.orm.public.UserLessonProgress.create.mockResolvedValue({
        id: "prog_1",
      });

      const result = await service.recordProgress("usr_1", "les_1", 100);

      expect(result.success).toBe(true);
      expect(result.score).toBe(100);
      expect(
        prismaMock.db.orm.public.UserLessonProgress.create
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "usr_1",
          lessonId: "les_1",
          score: 100,
        })
      );
    });
  });

  describe("submitFeedback", () => {
    it("should record lesson feedback", async () => {
      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({ id: "les_1" }),
      });

      prismaMock.db.orm.public.LessonFeedback.create.mockResolvedValue({
        id: "fb_1",
      });

      const result = await service.submitFeedback(
        "les_1",
        "helpful",
        "Great lesson!",
        "usr_1"
      );

      expect(result.success).toBe(true);
      expect(
        prismaMock.db.orm.public.LessonFeedback.create
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: "les_1",
          rating: "helpful",
          comment: "Great lesson!",
          userId: "usr_1",
        })
      );
    });
  });

  describe("generateNextUnitForLevel", () => {
    it("should generate and persist next unit topics for a level", async () => {
      vi.mocked(geminiServiceMock.generateCurriculumUnit).mockResolvedValue({
        unitTitle: "Unit 2: Daily Routines",
        topics: [
          {
            lessonIndex: 5,
            title: "Morning Routine",
            grammarKey: "routine-5",
            objective: "Learn morning expressions.",
          },
        ],
      });

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          {
            id: "top_1",
            level: "N5",
            unitIndex: 1,
            unitTitle: "Unit 1",
            lessonIndex: 4,
            title: "Lesson 4",
            grammarKey: "key-4",
            objective: "Obj 4",
          },
        ]),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([]),
      });

      const result = await service.generateNextUnitForLevel("N5");

      expect(geminiServiceMock.generateCurriculumUnit).toHaveBeenCalledWith("N5", 2, 5);
      expect(prismaMock.db.orm.public.CurriculumTopic.create).toHaveBeenCalledWith({
        level: "N5",
        unitIndex: 2,
        unitTitle: "Unit 2: Daily Routines",
        lessonIndex: 5,
        title: "Morning Routine",
        grammarKey: "routine-5",
        objective: "Learn morning expressions.",
      });
      expect(result).toBeDefined();
    });
  });
});

