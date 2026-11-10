import { describe, it, expect, beforeEach, vi } from "vitest";
import { FeedbackService } from "./feedback.service";
import { PrismaService } from "../prisma.service";
import { HttpException, HttpStatus, NotFoundException } from "@nestjs/common";

describe("FeedbackService", () => {
  let service: FeedbackService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      db: {
        orm: {
          public: {
            User: {
              first: vi.fn(),
            },
            FeedbackTicket: {
              create: vi.fn(),
              first: vi.fn(),
              all: vi.fn(),
              where: vi.fn().mockReturnValue({
                update: vi.fn(),
                delete: vi.fn(),
              }),
            },
          },
        },
      },
    };

    service = new FeedbackService(mockPrisma as unknown as PrismaService);
  });

  describe("create", () => {
    it("should successfully create a feedback ticket with client metadata", async () => {
      mockPrisma.db.orm.public.User.first.mockResolvedValue({
        id: "usr-1",
        username: "sakura",
        email: "sakura@example.com",
      });

      mockPrisma.db.orm.public.FeedbackTicket.create.mockImplementation((data: any) => ({
        id: "tkt-1",
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      const result = await service.create("usr-1", {
        type: "BUG",
        title: "Audio button unresponsive on mobile",
        description: "Tapping the sound icon on lesson 2 does not play Japanese audio on Chrome Android.",
        clientMetadata: {
          os: "Android 14",
          browser: "Chrome Mobile 120",
          viewport: "360x800",
          pathname: "/tutor",
        },
      });

      expect(result.id).toBe("tkt-1");
      expect(result.type).toBe("BUG");
      expect(result.status).toBe("OPEN");
      expect(result.title).toBe("Audio button unresponsive on mobile");
      expect(result.user?.username).toBe("sakura");
      expect(result.clientMetadata?.os).toBe("Android 14");
    });

    it("should throw NotFoundException if user is not found in database", async () => {
      mockPrisma.db.orm.public.User.first.mockResolvedValue(null);

      await expect(
        service.create("ghost-user", {
          type: "SUGGESTION",
          title: "Add dark mode toggle",
          description: "Would love an automatic dark mode according to system settings.",
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it("should enforce rate limiting and reject more than 10 submissions in an hour", async () => {
      mockPrisma.db.orm.public.User.first.mockResolvedValue({
        id: "usr-rate-limit",
        username: "tester",
        email: "test@example.com",
      });
      mockPrisma.db.orm.public.FeedbackTicket.create.mockImplementation((data: any) => ({
        id: "tkt-x",
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // 10 submissions should pass
      for (let i = 0; i < 10; i++) {
        await service.create("usr-rate-limit", {
          type: "FEEDBACK",
          title: `Submission test number ${i + 1}`,
          description: `This is a test description exceeding ten characters ${i + 1}`,
        });
      }

      // 11th submission should be rejected with 429 TOO_MANY_REQUESTS
      await expect(
        service.create("usr-rate-limit", {
          type: "FEEDBACK",
          title: "Submission number 11 should fail",
          description: "This should trigger the rate limit protection.",
        }),
      ).rejects.toThrow(HttpException);

      try {
        await service.create("usr-rate-limit", {
          type: "FEEDBACK",
          title: "Submission number 11 should fail",
          description: "This should trigger the rate limit protection.",
        });
      } catch (err: any) {
        expect(err.getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
      }
    });
  });

  describe("list", () => {
    it("should return tickets enriched with user data, sorted descending, and filtered by status and type", async () => {
      const mockTickets = [
        {
          id: "tkt-1",
          type: "BUG",
          status: "OPEN",
          title: "Crash on review",
          description: "Flashcard review crashes with long kanji strings",
          clientMetadata: null,
          adminNotes: null,
          userId: "usr-1",
          createdAt: "2026-11-09T10:00:00.000Z",
          updatedAt: "2026-11-09T10:00:00.000Z",
        },
        {
          id: "tkt-2",
          type: "SUGGESTION",
          status: "IN_PROGRESS",
          title: "Add export to Anki",
          description: "Allow exporting vocabulary decks to .apkg format",
          clientMetadata: null,
          adminNotes: "Working on it in v2.1",
          userId: "usr-2",
          createdAt: "2026-11-09T11:00:00.000Z",
          updatedAt: "2026-11-09T11:00:00.000Z",
        },
      ];

      mockPrisma.db.orm.public.FeedbackTicket.all.mockResolvedValue(mockTickets);
      mockPrisma.db.orm.public.User.first.mockImplementation(({ id }: { id: string }) => {
        if (id === "usr-1") return Promise.resolve({ id: "usr-1", username: "tanaka", email: "tanaka@test.com" });
        if (id === "usr-2") return Promise.resolve({ id: "usr-2", username: "suzuki", email: "suzuki@test.com" });
        return Promise.resolve(null);
      });

      // All tickets
      const all = await service.list();
      expect(all).toHaveLength(2);
      expect(all[0].id).toBe("tkt-2"); // more recent first
      expect(all[0].user?.username).toBe("suzuki");

      // Filter by status OPEN
      const openOnly = await service.list({ status: "OPEN" });
      expect(openOnly).toHaveLength(1);
      expect(openOnly[0].id).toBe("tkt-1");

      // Filter by type SUGGESTION
      const suggestionsOnly = await service.list({ type: "SUGGESTION" });
      expect(suggestionsOnly).toHaveLength(1);
      expect(suggestionsOnly[0].id).toBe("tkt-2");

      // Search by keyword
      const searchRes = await service.list({ search: "anki" });
      expect(searchRes).toHaveLength(1);
      expect(searchRes[0].title).toContain("Anki");
    });
  });

  describe("update", () => {
    it("should update status and admin notes", async () => {
      mockPrisma.db.orm.public.FeedbackTicket.first.mockResolvedValue({
        id: "tkt-1",
        userId: "usr-1",
        status: "OPEN",
        adminNotes: null,
      });

      const updatedTicket = {
        id: "tkt-1",
        type: "BUG",
        status: "RESOLVED",
        title: "Fixed issue",
        description: "Long description here for validation",
        clientMetadata: null,
        adminNotes: "Fixed in commit abc123",
        userId: "usr-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updateMock = vi.fn().mockResolvedValue(updatedTicket);
      mockPrisma.db.orm.public.FeedbackTicket.where.mockReturnValue({
        update: updateMock,
        delete: vi.fn(),
      });

      mockPrisma.db.orm.public.User.first.mockResolvedValue({
        id: "usr-1",
        username: "kenji",
        email: "kenji@test.com",
      });

      const updated = await service.update("tkt-1", {
        status: "RESOLVED",
        adminNotes: "Fixed in commit abc123",
      });

      expect(updated.status).toBe("RESOLVED");
      expect(updated.adminNotes).toBe("Fixed in commit abc123");
      expect(updateMock).toHaveBeenCalledWith({
        status: "RESOLVED",
        adminNotes: "Fixed in commit abc123",
      });
    });

    it("should throw NotFoundException if ticket to update does not exist", async () => {
      mockPrisma.db.orm.public.FeedbackTicket.first.mockResolvedValue(null);

      await expect(
        service.update("non-existent", { status: "CLOSED" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("should delete an existing ticket", async () => {
      mockPrisma.db.orm.public.FeedbackTicket.first.mockResolvedValue({
        id: "tkt-to-delete",
        userId: "usr-1",
      });
      const deleteMock = vi.fn().mockResolvedValue({});
      mockPrisma.db.orm.public.FeedbackTicket.where.mockReturnValue({
        update: vi.fn(),
        delete: deleteMock,
      });

      const result = await service.remove("tkt-to-delete");
      expect(result.success).toBe(true);
      expect(result.id).toBe("tkt-to-delete");
      expect(mockPrisma.db.orm.public.FeedbackTicket.where).toHaveBeenCalledWith({
        id: "tkt-to-delete",
      });
      expect(deleteMock).toHaveBeenCalled();
    });

    it("should throw NotFoundException when deleting non-existent ticket", async () => {
      mockPrisma.db.orm.public.FeedbackTicket.first.mockResolvedValue(null);

      await expect(service.remove("missing-tkt")).rejects.toThrow(NotFoundException);
    });
  });
});
