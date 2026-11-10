import { describe, it, expect, vi, beforeEach } from "vitest";
import { cookies } from "next/headers";
import {
  submitFeedbackAction,
  getAdminTicketsAction,
  updateAdminTicketAction,
  deleteAdminTicketAction,
} from "./feedback";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

describe("Feedback Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitFeedbackAction", () => {
    it("returns error if user is unauthenticated", async () => {
      const mockCookieStore = { get: vi.fn().mockReturnValue(undefined) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

      const result = await submitFeedbackAction({
        type: "BUG",
        title: "Test bug",
        description: "Test description exceeding minimum length",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("must be signed in");
    });

    it("submits ticket successfully with auth token", async () => {
      const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "jwt-token" }) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

      const createdTicket = {
        id: "tkt-1",
        type: "BUG",
        status: "OPEN",
        title: "Audio issue",
        description: "Audio does not play",
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(createdTicket),
      });

      const result = await submitFeedbackAction({
        type: "BUG",
        title: "Audio issue",
        description: "Audio does not play",
      });

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe("tkt-1");
    });

    it("handles backend error response", async () => {
      const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "jwt-token" }) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: vi.fn().mockResolvedValue({ message: "Rate limit exceeded" }),
      });

      const result = await submitFeedbackAction({
        type: "FEEDBACK",
        title: "Nice app",
        description: "Love the SRS system so far!",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Rate limit exceeded");
    });
  });

  describe("getAdminTicketsAction", () => {
    it("returns error if unauthenticated", async () => {
      const mockCookieStore = { get: vi.fn().mockReturnValue(undefined) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

      const result = await getAdminTicketsAction();
      expect(result.success).toBe(false);
      expect(result.tickets).toEqual([]);
    });

    it("returns list of tickets when authorized", async () => {
      const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "admin-jwt" }) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

      const mockList = [{ id: "tkt-1", status: "OPEN" }];
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(mockList),
      });

      const result = await getAdminTicketsAction({ status: "OPEN" });
      expect(result.success).toBe(true);
      expect(result.tickets).toHaveLength(1);
    });
  });

  describe("updateAdminTicketAction", () => {
    it("updates ticket status and notes", async () => {
      const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "admin-jwt" }) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ id: "tkt-1", status: "RESOLVED" }),
      });

      const result = await updateAdminTicketAction("tkt-1", { status: "RESOLVED" });
      expect(result.success).toBe(true);
      expect(result.ticket?.status).toBe("RESOLVED");
    });
  });

  describe("deleteAdminTicketAction", () => {
    it("deletes ticket successfully", async () => {
      const mockCookieStore = { get: vi.fn().mockReturnValue({ value: "admin-jwt" }) };
      vi.mocked(cookies).mockResolvedValue(mockCookieStore as unknown as Awaited<ReturnType<typeof cookies>>);

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ success: true }),
      });

      const result = await deleteAdminTicketAction("tkt-1");
      expect(result.success).toBe(true);
    });
  });
});
