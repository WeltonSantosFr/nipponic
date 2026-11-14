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
      geminiServiceMock,
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
        all: vi
          .fn()
          .mockResolvedValue([
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
      prismaMock.db.orm.public.LessonExercise.create.mockResolvedValue({
        id: "ex_new",
      });

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

      vi.mocked(geminiServiceMock.generateLesson).mockResolvedValue(
        mockGenerated,
      );

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

    it("PREBAKED LESSON: should return prebaked Unit 1 lesson (particle-wa-desu) without calling Gemini", async () => {
      const mockTopic = {
        id: "top_wa_desu",
        level: "N5",
        title: "Identity & The Copula (〜は〜です)",
        grammarKey: "particle-wa-desu",
        objective:
          "Learn how to introduce yourself and state identity using topic marker は and copula です.",
      };

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });

      prismaMock.db.orm.public.Lesson.create.mockResolvedValue({
        id: "les_wa_desu",
        topicId: "top_wa_desu",
        title: "Identity & The Copula (〜は〜です)",
        level: "N5",
        theoryMarkdown: "### 📘 Stating Identity: A は B です",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      });

      prismaMock.db.orm.public.LessonExercise.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          {
            id: "ex_1",
            order: 1,
            type: "multiple_choice",
            prompt: "Choose the correct particle...",
            optionsJson: ["は", "が", "を", "に"],
            correctAnswer: "は",
            explanation: "Particle は marks topic.",
          },
        ]),
      });

      const result = await service.getLessonByTopicId("top_wa_desu");

      // Verify Gemini was NOT called because prebaked content exists
      expect(geminiServiceMock.generateLesson).not.toHaveBeenCalled();
      expect(prismaMock.db.orm.public.Lesson.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Identity & The Copula (〜は〜です)",
          level: "N5",
        }),
      );
      expect(result.title).toBe("Identity & The Copula (〜は〜です)");
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
        theoryMarkdown:
          "### ざるを得ない\nFormulas: V-ない (stem) + ざるを得ない",
        dialogue: [
          {
            speaker: "A",
            jpText: "行かざるを得ない",
            enText: "I have no choice but to go",
          },
        ],
        vocabulary: [
          {
            jpText: "ざるを得ない",
            reading: "ざるをえない",
            enText: "Cannot help but",
          },
        ],
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

      prismaMock.db.orm.public.LessonExercise.where.mockImplementation(
        (filter: any) => ({
          all: vi
            .fn()
            .mockResolvedValue(
              filter.lessonId === "les_stale"
                ? [{ id: "old_ex_1" }]
                : [{ id: "new_ex_1", order: 1 }],
            ),
          delete: deleteExerciseMock,
        }),
      );

      vi.mocked(geminiServiceMock.generateLesson).mockResolvedValue(
        mockGenerated,
      );

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
        theoryMarkdown:
          "### Key Formula\n`[Phrase / Stem] + kiwamarinai-extreme`",
        dialogueJson: [],
        vocabularyJson: [
          {
            jpText: "kiwamarinai-extreme",
            reading: "kiwamarinai-extreme",
            enText: "Extreme",
          },
        ],
        createdAt: new Date(),
      };

      const mockFreshGenerated = {
        title: "Extreme Emotional States (〜極まりない / 〜極まる)",
        theoryMarkdown: "### 〜極まりない\nFormulas: Na-stem + 極まりない",
        dialogue: [
          {
            speaker: "田中",
            jpText: "危険極まりない",
            enText: "Extremely dangerous",
          },
        ],
        vocabulary: [
          { jpText: "極まりない", reading: "きわまりない", enText: "Extreme" },
        ],
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

      prismaMock.db.orm.public.LessonExercise.where.mockImplementation(
        (filter: any) => ({
          all: vi
            .fn()
            .mockResolvedValue(
              filter.lessonId === "les_bogus_slug"
                ? [{ id: "old_ex_slug" }]
                : [{ id: "new_ex_1", order: 1 }],
            ),
          delete: deleteExerciseMock,
        }),
      );

      vi.mocked(geminiServiceMock.generateLesson).mockResolvedValue(
        mockFreshGenerated,
      );

      const result = await service.getLessonByTopicId("top_kiwamar");

      expect(deleteLessonMock).toHaveBeenCalled();
      expect(deleteExerciseMock).toHaveBeenCalled();
      expect(result.id).toBe("les_fresh_kiwamar");
      expect(result.theoryMarkdown).toContain("極まりない");
    });

    it("REGRESSION: should NOT delete lesson or UserLessonProgress when theory contains hyphenated words like Tanaka-san or self-propelled", async () => {
      const mockTopic = {
        id: "top_wa_desu_reg",
        level: "N5",
        title: "Identity & The Copula (〜は〜です)",
        grammarKey: "particle-wa-desu",
        objective: "Learn identity",
      };

      const mockExistingLesson = {
        id: "les_existing_1",
        topicId: "top_wa_desu_reg",
        title: "Identity & The Copula (〜は〜です)",
        level: "N5",
        theoryMarkdown: "### A は B です\nExample with Tanaka-san and non-living objects.",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      };

      const deleteLessonMock = vi.fn().mockResolvedValue({});
      const deleteProgressMock = vi.fn().mockResolvedValue({});

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockExistingLesson),
        update: vi.fn().mockResolvedValue({}),
        delete: deleteLessonMock,
      });

      prismaMock.db.orm.public.UserLessonProgress.where.mockReturnValue({
        first: vi.fn().mockResolvedValue({
          id: "prog_1",
          userId: "usr_1",
          lessonId: "les_existing_1",
          completedAt: new Date(),
          score: 100,
        }),
        delete: deleteProgressMock,
      });

      prismaMock.db.orm.public.LessonExercise.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([{ id: "ex_1", order: 1 }]),
        delete: vi.fn().mockResolvedValue({}),
      });
      prismaMock.db.orm.public.LessonExercise.create.mockResolvedValue({});

      const result = await service.getLessonByTopicId("top_wa_desu_reg", "usr_1");

      expect(deleteLessonMock).not.toHaveBeenCalled();
      expect(deleteProgressMock).not.toHaveBeenCalled();
      expect(result.id).toBe("les_existing_1");
      expect(result.isCompleted).toBe(true);
      expect(result.score).toBe(100);
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

    it("FEEDBACK: should NOT trigger regeneration or deletion when feedbacks are negative (ratings are illustrative)", async () => {
      const mockTopic = {
        id: "top_fb_3",
        level: "N1",
        title: "Formal Nuance たるもの",
        grammarKey: "tarumono",
        objective: "Express conduct befitting a status",
      };

      const mockExistingLesson = {
        id: "les_existing_fb",
        topicId: "top_fb_3",
        title: "Formal Nuance たるもの",
        level: "N1",
        theoryMarkdown: "### Existing theory",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      };

      const deleteLessonMock = vi.fn().mockResolvedValue({});
      const deleteExerciseMock = vi.fn().mockResolvedValue({});

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockExistingLesson),
        delete: deleteLessonMock,
      });

      // 3 reviews: 2 confusing, 1 helpful = 66.7% confusing
      prismaMock.db.orm.public.LessonFeedback.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([
          {
            id: "fb_1",
            rating: "confusing",
            comment: "Examples were too abstract",
          },
          {
            id: "fb_2",
            rating: "confusing",
            comment: "Needs better conjugation explanation",
          },
          { id: "fb_3", rating: "helpful", comment: null },
        ]),
      });

      prismaMock.db.orm.public.LessonExercise.where.mockReturnValue({
        all: vi.fn().mockResolvedValue([{ id: "ex_1", order: 1 }]),
        delete: deleteExerciseMock,
      });

      const result = await service.getLessonByTopicId("top_fb_3");

      expect(deleteLessonMock).not.toHaveBeenCalled();
      expect(deleteExerciseMock).not.toHaveBeenCalled();
      expect(geminiServiceMock.generateLesson).not.toHaveBeenCalled();
      expect(result.id).toBe("les_existing_fb");
      expect(result.theoryMarkdown).toBe("### Existing theory");
    });

    it("should throw NotFoundException if topic does not exist", async () => {
      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });

      await expect(service.getLessonByTopicId("unknown")).rejects.toThrow(
        NotFoundException,
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
        prismaMock.db.orm.public.UserLessonProgress.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "usr_1",
          lessonId: "les_1",
          score: 100,
        }),
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
        "usr_1",
      );

      expect(result.success).toBe(true);
      expect(
        prismaMock.db.orm.public.LessonFeedback.create,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          lessonId: "les_1",
          rating: "helpful",
          comment: "Great lesson!",
          userId: "usr_1",
        }),
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

      expect(geminiServiceMock.generateCurriculumUnit).toHaveBeenCalledWith(
        "N5",
        2,
        5,
      );
      expect(
        prismaMock.db.orm.public.CurriculumTopic.create,
      ).toHaveBeenCalledWith({
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

    it("REGRESSION: should detect duplicate exercise orders, delete old exercises by primary key id, and re-sync prebaked exercises cleanly", async () => {
      const mockTopic = {
        id: "top_wa_desu_dup",
        level: "N5",
        title: "Identity & The Copula (〜は〜です)",
        grammarKey: "particle-wa-desu",
        objective: "Learn identity",
      };

      const mockExistingLesson = {
        id: "les_existing_dup",
        topicId: "top_wa_desu_dup",
        title: "Identity & The Copula (〜は〜です)",
        level: "N5",
        theoryMarkdown: "### 📘 Stating Identity: A は B です",
        dialogueJson: [],
        vocabularyJson: [],
        createdAt: new Date(),
      };

      const staleExercisesWithDuplicates = [
        { id: "ex_mc_1", order: 1, type: "multiple_choice", prompt: "Q1", optionsJson: ["A"], correctAnswer: "A", explanation: "" },
        { id: "ex_fb_dup1", order: 2, type: "fill_blank", prompt: "Q2", optionsJson: null, correctAnswer: "B", explanation: "" },
        { id: "ex_fb_dup2", order: 2, type: "fill_blank", prompt: "Q3", optionsJson: null, correctAnswer: "C", explanation: "" },
        { id: "ex_ro_dup1", order: 3, type: "reorder", prompt: "Q4", optionsJson: ["D"], correctAnswer: "D", explanation: "" },
        { id: "ex_ro_dup2", order: 3, type: "reorder", prompt: "Q5", optionsJson: ["E"], correctAnswer: "E", explanation: "" },
      ];

      const deleteExerciseByIdMock = vi.fn().mockResolvedValue({});
      const createExerciseMock = vi.fn().mockResolvedValue({});

      prismaMock.db.orm.public.CurriculumTopic.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockTopic),
      });

      prismaMock.db.orm.public.Lesson.where.mockReturnValue({
        first: vi.fn().mockResolvedValue(mockExistingLesson),
        update: vi.fn().mockResolvedValue({}),
      });

      let allCallCount = 0;
      prismaMock.db.orm.public.LessonExercise.where.mockImplementation((filter: any) => {
        if (filter?.id) {
          return {
            delete: deleteExerciseByIdMock,
          };
        }
        return {
          all: vi.fn().mockImplementation(async () => {
            allCallCount++;
            if (allCallCount === 1) {
              return staleExercisesWithDuplicates;
            }
            return [
              { id: "ex_clean_1", order: 1, type: "multiple_choice", prompt: "Q1", optionsJson: ["は"], correctAnswer: "は", explanation: "" },
              { id: "ex_clean_2", order: 2, type: "fill_blank", prompt: "Q2", optionsJson: null, correctAnswer: "です", explanation: "" },
              { id: "ex_clean_3", order: 3, type: "reorder", prompt: "Q3", optionsJson: ["私"], correctAnswer: "私", explanation: "" },
            ];
          }),
        };
      });

      prismaMock.db.orm.public.LessonExercise.create = createExerciseMock;

      const result = await service.getLessonByTopicId("top_wa_desu_dup");

      // Verify that all 5 stale exercises were individually deleted by primary key id
      expect(deleteExerciseByIdMock).toHaveBeenCalledTimes(5);

      // Verify 3 clean prebaked exercises were created
      expect(createExerciseMock).toHaveBeenCalledTimes(3);

      // Verify returned exercises are normalized with sequential orders 1, 2, 3
      expect(result.exercises).toHaveLength(3);
      expect(result.exercises.map(e => e.order)).toEqual([1, 2, 3]);
    });
  });
});
