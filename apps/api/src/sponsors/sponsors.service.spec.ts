import { describe, it, expect, vi, beforeEach } from "vitest";
import { SponsorsService } from "./sponsors.service";
import { ConflictException } from "@nestjs/common";

describe("SponsorsService", () => {
  let service: SponsorsService;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      db: {
        orm: {
          public: {
            User: {
              first: vi.fn(),
              where: vi.fn().mockReturnValue({
                update: vi.fn(),
              }),
            },
            Sponsor: {
              all: vi.fn(),
              first: vi.fn(),
              create: vi.fn(),
              where: vi.fn().mockReturnValue({
                update: vi.fn(),
              }),
            },
          },
        },
      },
    };

    service = new SponsorsService(prismaMock);
  });

  it("findAllPublic - should return list of sponsors sorted with active first", async () => {
    prismaMock.db.orm.public.Sponsor.all.mockResolvedValue([
      {
        id: "1",
        githubUsername: "inactive_user",
        name: "Inactive User",
        avatarUrl: "https://avatar.png",
        tierName: "🌱 Green Tea",
        monthlyPriceInCents: 100,
        isOneTime: false,
        isActive: false,
        createdAt: new Date("2026-01-01"),
      },
      {
        id: "2",
        githubUsername: "active_user",
        name: "Active User",
        avatarUrl: "https://avatar2.png",
        tierName: "🍜 Ramen",
        monthlyPriceInCents: 500,
        isOneTime: false,
        isActive: true,
        createdAt: new Date("2026-02-01"),
      },
    ]);

    const result = await service.findAllPublic();

    expect(result.length).toBe(2);
    expect(result[0].githubUsername).toBe("active_user");
    expect(result[1].githubUsername).toBe("inactive_user");
  });

  it("linkGithub - should link username and detect active sponsor", async () => {
    prismaMock.db.orm.public.User.first.mockResolvedValue(null);
    prismaMock.db.orm.public.Sponsor.first.mockResolvedValue({
      id: "sp_1",
      githubUsername: "weltonsf",
      isActive: true,
      tierName: "🍜 Ramen",
    });

    const result = await service.linkGithub("usr_123", { githubUsername: "weltonsf" });

    expect(result.isSupporter).toBe(true);
    expect(result.isActiveSupporter).toBe(true);
    expect(result.tierName).toBe("🍜 Ramen");
  });

  it("linkGithub - should throw conflict if username already linked to another user", async () => {
    prismaMock.db.orm.public.User.first.mockResolvedValue({
      id: "usr_other",
      githubUsername: "taken_user",
    });

    await expect(
      service.linkGithub("usr_123", { githubUsername: "taken_user" })
    ).rejects.toThrow(ConflictException);
  });

  it("handleWebhook - should create new sponsor on sponsorship.created", async () => {
    prismaMock.db.orm.public.User.first.mockResolvedValue(null);
    prismaMock.db.orm.public.Sponsor.first.mockResolvedValue(null);

    const payload = {
      action: "created",
      sponsorship: {
        sponsor: { login: "new_supporter", id: 999, avatar_url: "https://github.com/avatar.png" },
        tier: { name: "🍱 Bento", monthly_price_in_cents: 300, is_one_time: false },
      },
    };

    const res = await service.handleWebhook(payload);

    expect(res.status).toBe("success");
    expect(prismaMock.db.orm.public.Sponsor.create).toHaveBeenCalled();
  });

  it("clearMockSponsors - should delete all sponsors and return count", async () => {
    const deleteMock = vi.fn();
    prismaMock.db.orm.public.Sponsor.all.mockResolvedValue([
      { id: "sp_1" },
      { id: "sp_2" },
    ]);
    prismaMock.db.orm.public.Sponsor.where.mockReturnValue({
      delete: deleteMock,
    });

    const res = await service.clearMockSponsors();

    expect(res.success).toBe(true);
    expect(res.count).toBe(2);
    expect(deleteMock).toHaveBeenCalledTimes(2);
  });
});

