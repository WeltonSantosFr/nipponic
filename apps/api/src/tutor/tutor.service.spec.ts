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
              where: vi.fn().mockReturnValue({
                all: vi.fn().mockResolvedValue([]),
                delete: vi.fn().mockResolvedValue({}),
              }),
            },
            UserLessonProgress: {
              first: vi.fn(),
              create: vi.fn(),
              where: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(null),
                all: vi.fn().mockResolvedValue([]),
                delete: vi.fn().mockResolvedValue({}),
              }),
            },
            LessonFeedback: {
              create: vi.fn(),
              where: vi.fn().mockReturnValue({
                all: vi.fn().mockResolvedValue([]),
                delete: vi.fn().mockResolvedValue({}),
              }),
            },
          },
        },
      },
    };

    geminiServiceMock = {
      generateLesson: vi.fn(),
      generateCurriculumUnit: vi.fn(),
      generateFallbackLesson: vi.fn(),
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

    it("STALE BOGUS FALLBACK: should discard bogus desu fallback lesson on non-desu topics and regenerate via Gemini", async () => {
      const mockTopic = {
        id: "top_n1",
        level: "N1",
        title: "Classical Negative Nuance ざるを得ない",
        grammarKey: "zaru-wo-enai",
        objective: "Master expressing unavoidable actions",
      };

      const mockStaleLesson = {
        id: "les_stale",
        topicId: "top_n1",
        title: "Classical Negative Nuance ざるを得ない",
        level: "N1",
        theoryMarkdown: "### Key Formula\n`[Noun / Phrase] + です`",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      };

      const mockGenerated = {
        title: "Classical Negative Nuance ざるを得ない",
        theoryMarkdown: "### ざるを得ない\nFormulas: V-ない (stem) + ざるを得ない",
        dialogue: [{ speaker: "A", jpText: "行かざるを得ない", enText: "I have no choice but to go" }],
        vocabulary: [{ jpText: "ざるを得ない", reading: "ざるをえない", enText: "Cannot help but" }],
        exercises: [
          {
            order: 1,
            type: "multiple_choice" as const,
            prompt: "Choose the correct form",
            options: ["行かざるを得ない", "行くです"],
            correctAnswer: "行かざるを得ない",
            explanation: "Correct N1 grammar",
          },
        ],
      };

      const mockNewLesson = {
        id: "les_fresh_n1",
        topicId: "top_n1",
        title: "Classical Negative Nuance ざるを得ない",
        level: "N1",
        theoryMarkdown: mockGenerated.theoryMarkdown,
        dialogueJson: mockGenerated.dialogue,
        vocabularyJson: mockGenerated.vocabulary,
        createdAt: new Date(),
      };

      const deleteLessonMock = vi.fn().mockResolvedValue({});
      const deleteExerciseMock = vi.fn().mockResolvedValue({});

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockStaleLesson),
        delete: deleteLessonMock,
      });

      prismaMock.db.orm.public.Lesson.create.mockResolvedValue(mockNewLesson);

      prismaMock.db.orm.public.LessonExercise.where.mockImplementation((filter: any) => ({
        all: vi.fn().mockResolvedValue(
          filter.lessonId === "les_stale" ? [{ id: "old_ex_1" }] : [{ id: "new_ex_1", order: 1 }]
        ),
        delete: deleteExerciseMock,
      }));

      vi.mocked(geminiServiceMock.generateLesson).mockResolvedValue(mockGenerated);

      const result = await service.getLessonByTopicId("top_n1");

      // Verifies old bogus lesson was deleted
      expect(deleteLessonMock).toHaveBeenCalled();
      expect(deleteExerciseMock).toHaveBeenCalled();

      // Verifies Gemini was called with topic's actual context
      expect(geminiServiceMock.generateLesson).toHaveBeenCalledWith({
        title: "Classical Negative Nuance ざるを得ない",
        level: "N1",
        grammarKey: "zaru-wo-enai",
        objective: "Master expressing unavoidable actions",
      });

      expect(prismaMock.db.orm.public.Lesson.create).toHaveBeenCalled();
      expect(result.id).toBe("les_fresh_n1");
      expect(result.theoryMarkdown).toContain("ざるを得ない");
    });

    it("STALE BOGUS FALLBACK: should discard bogus lesson with romaji slug leaks (e.g. kiwamarinai-extreme) and regenerate via Gemini", async () => {
      const mockTopic = {
        id: "top_kiwamar",
        level: "N1",
        title: "Extreme Emotional States (〜極まりない / 〜極まる)",
        grammarKey: "kiwamarinai-extreme",
        objective: "Express uncontainable extreme emotional states",
      };

      const mockBogusRomajiLesson = {
        id: "les_bogus_slug",
        topicId: "top_kiwamar",
        title: "Extreme Emotional States",
        level: "N1",
        theoryMarkdown: "### Key Formula\n`[Phrase / Stem] + kiwamarinai-extreme`",
        dialogueJson: [],
        vocabularyJson: [
          { jpText: "kiwamarinai-extreme", reading: "kiwamarinai-extreme", enText: "Extreme" },
        ],
        createdAt: new Date(),
      };

      const mockFreshGenerated = {
        title: "Extreme Emotional States (〜極まりない / 〜極まる)",
        theoryMarkdown: "### 〜極まりない\nFormulas: Na-stem + 極まりない",
        dialogue: [{ speaker: "田中", jpText: "危険極まりない", enText: "Extremely dangerous" }],
        vocabulary: [{ jpText: "極まりない", reading: "きわまりない", enText: "Extreme" }],
        exercises: [
          {
            order: 1,
            type: "multiple_choice" as const,
            prompt: "Choose the correct phrase",
            options: ["危険極まりない", "危険だ"],
            correctAnswer: "危険極まりない",
            explanation: "Natural N1 expression",
          },
        ],
      };

      const deleteLessonMock = vi.fn().mockResolvedValue({});
      const deleteExerciseMock = vi.fn().mockResolvedValue({});

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockBogusRomajiLesson),
        delete: deleteLessonMock,
      });

      prismaMock.db.orm.public.Lesson.create.mockResolvedValue({
        id: "les_fresh_kiwamar",
        topicId: "top_kiwamar",
        title: mockFreshGenerated.title,
        level: "N1",
        theoryMarkdown: mockFreshGenerated.theoryMarkdown,
        dialogueJson: mockFreshGenerated.dialogue,
        vocabularyJson: mockFreshGenerated.vocabulary,
        createdAt: new Date(),
      });

      prismaMock.db.orm.public.LessonExercise.where.mockImplementation((filter: any) => ({
        all: vi.fn().mockResolvedValue(
          filter.lessonId === "les_bogus_slug" ? [{ id: "old_ex_slug" }] : [{ id: "new_ex_1", order: 1 }]
        ),
        delete: deleteExerciseMock,
      }));

      vi.mocked(geminiServiceMock.generateLesson).mockResolvedValue(mockFreshGenerated);

      const result = await service.getLessonByTopicId("top_kiwamar");

      expect(deleteLessonMock).toHaveBeenCalled();
      expect(deleteExerciseMock).toHaveBeenCalled();
      expect(result.id).toBe("les_fresh_kiwamar");
      expect(result.theoryMarkdown).toContain("極まりない");
    });

    it("FEEDBACK THRESHOLD: should NOT regenerate if total feedbacks < 3 even if 100% are confusing", async () => {
      const mockTopic = {
        id: "top_fb_1",
        level: "N3",
        title: "Expression わけだ",
        grammarKey: "wakeda",
        objective: "Understand natural conclusions",
      };

      const mockLesson = {
        id: "les_fb_1",
        topicId: "top_fb_1",
        title: "Expression わけだ",
        level: "N3",
        theoryMarkdown: "### わけだ Theory",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      };

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockLesson),
      });

      // 2 reviews, both confusing (100% confusing, but total < 3)
      prismaMock.db.orm.public.LessonFeedback.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          { id: "fb_1", rating: "confusing" },
          { id: "fb_2", rating: "confusing" },
        ]),
      });

      prismaMock.db.orm.public.LessonExercise.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([{ id: "ex_1", order: 1 }]),
      });

      const result = await service.getLessonByTopicId("top_fb_1");

      expect(result.id).toBe("les_fb_1");
      expect(geminiServiceMock.generateLesson).not.toHaveBeenCalled();
    });

    it("FEEDBACK THRESHOLD: should NOT regenerate if total feedbacks >= 3 but confusing ratio < 60%", async () => {
      const mockTopic = {
        id: "top_fb_2",
        level: "N3",
        title: "Expression はずだ",
        grammarKey: "hazuda",
        objective: "Expectations with reasonable certainty",
      };

      const mockLesson = {
        id: "les_fb_2",
        topicId: "top_fb_2",
        title: "Expression はずだ",
        level: "N3",
        theoryMarkdown: "### はずだ Theory",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      };

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockLesson),
      });

      // 3 reviews: 1 confusing, 2 helpful = 33.3% confusing (< 60%)
      prismaMock.db.orm.public.LessonFeedback.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          { id: "fb_1", rating: "confusing" },
          { id: "fb_2", rating: "helpful" },
          { id: "fb_3", rating: "helpful" },
        ]),
      });

      prismaMock.db.orm.public.LessonExercise.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([{ id: "ex_1", order: 1 }]),
      });

      const result = await service.getLessonByTopicId("top_fb_2");

      expect(result.id).toBe("les_fb_2");
      expect(geminiServiceMock.generateLesson).not.toHaveBeenCalled();
    });

    it("FEEDBACK THRESHOLD: should trigger regeneration when feedbacks >= 3 and confusing ratio >= 60%", async () => {
      const mockTopic = {
        id: "top_fb_3",
        level: "N1",
        title: "Formal Nuance たるもの",
        grammarKey: "tarumono",
        objective: "Express conduct befitting a status",
      };

      const mockStaleLesson = {
        id: "les_stale_fb",
        topicId: "top_fb_3",
        title: "Formal Nuance たるもの",
        level: "N1",
        theoryMarkdown: "### Brief theory",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      };

      const deleteLessonMock = vi.fn().mockResolvedValue({});
      const deleteExerciseMock = vi.fn().mockResolvedValue({});
      const deleteFeedbackMock = vi.fn().mockResolvedValue({});

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockStaleLesson),
        delete: deleteLessonMock,
      });

      // 3 reviews: 2 confusing, 1 helpful = 66.7% confusing (>= 60%)
      prismaMock.db.orm.public.LessonFeedback.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          { id: "fb_1", rating: "confusing", comment: "Examples were too abstract" },
          { id: "fb_2", rating: "confusing", comment: "Needs better conjugation explanation" },
          { id: "fb_3", rating: "helpful", comment: null },
        ]),
        delete: deleteFeedbackMock,
      });

      const mockUpgradedGenerated = {
        title: "Upgraded Formal Nuance たるもの",
        theoryMarkdown: "### Enhanced Step-by-Step Theory for たるもの",
        dialogue: [{ speaker: "社長", jpText: "指導者たるもの、模範を示さねばならない。", enText: "As a leader..." }],
        vocabulary: [{ jpText: "たるもの", reading: "たるもの", enText: "Befitting" }],
        exercises: [
          {
            order: 1,
            type: "multiple_choice" as const,
            prompt: "Select correct usage",
            options: ["たるもの", "ごとき"],
            correctAnswer: "たるもの",
            explanation: "Befitting status",
          },
        ],
      };

      prismaMock.db.orm.public.Lesson.create.mockResolvedValue({
        id: "les_upgraded_fb",
        topicId: "top_fb_3",
        title: mockUpgradedGenerated.title,
        level: "N1",
        theoryMarkdown: mockUpgradedGenerated.theoryMarkdown,
        dialogueJson: mockUpgradedGenerated.dialogue,
        vocabularyJson: mockUpgradedGenerated.vocabulary,
        createdAt: new Date(),
      });

      prismaMock.db.orm.public.LessonExercise.where.mockImplementation((filter: any) => ({
        all: vi.fn().mockResolvedValue(
          filter.lessonId === "les_stale_fb" ? [{ id: "old_ex_fb" }] : [{ id: "new_ex_fb", order: 1 }]
        ),
        delete: deleteExerciseMock,
      }));

      vi.mocked(geminiServiceMock.generateLesson).mockResolvedValue(mockUpgradedGenerated);

      const result = await service.getLessonByTopicId("top_fb_3");

      expect(deleteLessonMock).toHaveBeenCalled();
      expect(deleteExerciseMock).toHaveBeenCalled();
      expect(deleteFeedbackMock).toHaveBeenCalled();
      expect(geminiServiceMock.generateLesson).toHaveBeenCalledWith({
        title: "Formal Nuance たるもの",
        level: "N1",
        grammarKey: "tarumono",
        objective: "Express conduct befitting a status",
        isRegeneration: true,
        regenerationReason: expect.stringContaining("67% confusing ratings (2/3 reviews)"),
        previousFeedbackComments: [
          "Examples were too abstract",
          "Needs better conjugation explanation",
        ],
      });

      expect(result.id).toBe("les_upgraded_fb");
      expect(result.theoryMarkdown).toContain("Enhanced Step-by-Step Theory");
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

    it("should return fallback seed curriculum when database query throws an error", async () => {
      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        all: vi.fn().mockRejectedValue(new Error("relation does not exist")),
      });

      const result = await service.getCurriculum("N5");

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toContain("seed-N5-");
      expect(result[0].level).toBe("N5");
    });

    it("should execute ensureTablesExist without crashing", async () => {
      const executeMock = vi.fn().mockResolvedValue({ affectedRows: 0 });
      prismaMock.connect = vi.fn().mockResolvedValue(undefined);
      prismaMock.db.runtime = vi.fn().mockReturnValue({
        driver: {
          execute: executeMock,
        },
      });

      await expect(service.ensureTablesExist()).resolves.toBeUndefined();
      expect(executeMock).toHaveBeenCalled();
    });
  });
});

