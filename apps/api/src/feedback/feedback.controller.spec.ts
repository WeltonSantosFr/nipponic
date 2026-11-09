import { describe, it, expect, beforeEach, vi } from "vitest";
import { FeedbackController } from "./feedback.controller";
import { FeedbackService } from "./feedback.service";
import type { JwtPayload } from "@nipponic/shared";

describe("FeedbackController", () => {
  let controller: FeedbackController;
  let service: FeedbackService;

  const mockUser: JwtPayload = {
    sub: "usr-admin",
    username: "adminUser",
    email: "admin@nipponic.app",
    role: "ADMIN",
  };

  beforeEach(() => {
    service = {
      create: vi.fn(),
      list: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    } as unknown as FeedbackService;

    controller = new FeedbackController(service);
  });

  it("should forward ticket creation from authenticated user", async () => {
    const dto = {
      type: "BUG" as const,
      title: "Broken link",
      description: "Footer privacy policy link gives 404",
    };
    (service.create as any).mockResolvedValue({ id: "tkt-1", ...dto });

    const result = await controller.create(mockUser, dto);
    expect(service.create).toHaveBeenCalledWith("usr-admin", dto);
    expect(result.id).toBe("tkt-1");
  });

  it("should list tickets for admin", async () => {
    (service.list as any).mockResolvedValue([{ id: "tkt-1" }]);
    const query = { status: "OPEN" as const };

    const result = await controller.listAdmin(query);
    expect(service.list).toHaveBeenCalledWith(query);
    expect(result).toHaveLength(1);
  });

  it("should get ticket details for admin", async () => {
    (service.findOne as any).mockResolvedValue({ id: "tkt-123" });
    const result = await controller.findOneAdmin("tkt-123");
    expect(service.findOne).toHaveBeenCalledWith("tkt-123");
    expect(result.id).toBe("tkt-123");
  });

  it("should update ticket status or notes for admin", async () => {
    (service.update as any).mockResolvedValue({ id: "tkt-1", status: "RESOLVED" });
    const updateDto = { status: "RESOLVED" as const, adminNotes: "Done!" };

    const result = await controller.updateAdmin("tkt-1", updateDto);
    expect(service.update).toHaveBeenCalledWith("tkt-1", updateDto);
    expect(result.status).toBe("RESOLVED");
  });

  it("should remove ticket for admin", async () => {
    (service.remove as any).mockResolvedValue({ success: true, id: "tkt-1" });

    const result = await controller.removeAdmin("tkt-1");
    expect(service.remove).toHaveBeenCalledWith("tkt-1");
    expect(result.success).toBe(true);
  });
});
