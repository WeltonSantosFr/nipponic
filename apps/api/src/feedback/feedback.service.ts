import {
  Inject,
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import {
  type CreateFeedbackTicketDto,
  type UpdateFeedbackTicketDto,
  type FeedbackListQueryDto,
  type FeedbackTicket,
  CreateFeedbackTicketSchema,
  UpdateFeedbackTicketSchema,
} from "@nipponic/shared";

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);
  // Map of userId -> array of submission timestamps in ms
  private readonly submissions = new Map<string, number[]>();
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
  private readonly MAX_SUBMISSIONS_PER_WINDOW = 10;

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  checkRateLimit(userId: string): void {
    const now = Date.now();
    const timestamps = (this.submissions.get(userId) || []).filter(
      (ts) => now - ts < this.RATE_LIMIT_WINDOW_MS,
    );

    if (timestamps.length >= this.MAX_SUBMISSIONS_PER_WINDOW) {
      throw new HttpException(
        "Too many feedback submissions. Please try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    timestamps.push(now);
    this.submissions.set(userId, timestamps);
  }

  // Exposed for testing
  resetRateLimits(): void {
    this.submissions.clear();
  }

  async create(userId: string, data: CreateFeedbackTicketDto): Promise<FeedbackTicket> {
    this.checkRateLimit(userId);
    const parsed = CreateFeedbackTicketSchema.parse(data);

    const user = await this.prisma.db.orm.public.User.first({ id: userId });
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const created = await this.prisma.db.orm.public.FeedbackTicket.create({
      type: parsed.type,
      status: "OPEN",
      title: parsed.title,
      description: parsed.description,
      clientMetadata: (parsed.clientMetadata as any) ?? null,
      adminNotes: null,
      userId,
    });

    return {
      id: created.id,
      type: created.type as FeedbackTicket["type"],
      status: created.status as FeedbackTicket["status"],
      title: created.title,
      description: created.description,
      clientMetadata: created.clientMetadata as FeedbackTicket["clientMetadata"],
      adminNotes: created.adminNotes ?? null,
      userId: created.userId,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async list(query?: FeedbackListQueryDto): Promise<FeedbackTicket[]> {
    // Fetch all tickets or filtered
    let tickets: any[];
    try {
      tickets = await this.prisma.db.orm.public.FeedbackTicket.all();
    } catch {
      tickets = [];
    }

    // Sort descending by createdAt
    tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Enrich with user information
    const userIds = [...new Set(tickets.map((t) => t.userId))];
    const userMap = new Map<string, { id: string; username: string; email: string }>();

    for (const uid of userIds) {
      const u = await this.prisma.db.orm.public.User.first({ id: uid }).catch(() => null);
      if (u) {
        userMap.set(uid, { id: u.id, username: u.username, email: u.email });
      }
    }

    let results = tickets.map((t) => ({
      id: t.id,
      type: t.type as FeedbackTicket["type"],
      status: t.status as FeedbackTicket["status"],
      title: t.title,
      description: t.description,
      clientMetadata: t.clientMetadata as FeedbackTicket["clientMetadata"],
      adminNotes: t.adminNotes ?? null,
      userId: t.userId,
      user: userMap.get(t.userId),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));

    if (query?.status) {
      results = results.filter((t) => t.status === query.status);
    }
    if (query?.type) {
      results = results.filter((t) => t.type === query.type);
    }
    if (query?.search?.trim()) {
      const q = query.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.user?.username.toLowerCase().includes(q) ||
          t.user?.email.toLowerCase().includes(q),
      );
    }

    return results;
  }

  async findOne(id: string): Promise<FeedbackTicket> {
    const ticket = await this.prisma.db.orm.public.FeedbackTicket.first({ id });
    if (!ticket) {
      throw new NotFoundException("Feedback ticket not found");
    }

    const user = await this.prisma.db.orm.public.User.first({ id: ticket.userId });

    return {
      id: ticket.id,
      type: ticket.type as FeedbackTicket["type"],
      status: ticket.status as FeedbackTicket["status"],
      title: ticket.title,
      description: ticket.description,
      clientMetadata: ticket.clientMetadata as FeedbackTicket["clientMetadata"],
      adminNotes: ticket.adminNotes ?? null,
      userId: ticket.userId,
      user: user ? { id: user.id, username: user.username, email: user.email } : undefined,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };
  }

  async update(id: string, data: UpdateFeedbackTicketDto): Promise<FeedbackTicket> {
    const parsed = UpdateFeedbackTicketSchema.parse(data);
    const existing = await this.prisma.db.orm.public.FeedbackTicket.first({ id });
    if (!existing) {
      throw new NotFoundException("Feedback ticket not found");
    }

    const updated = await this.prisma.db.orm.public.FeedbackTicket.where({ id }).update({
      ...(parsed.status ? { status: parsed.status } : {}),
      ...(parsed.adminNotes !== undefined ? { adminNotes: parsed.adminNotes } : {}),
    });

    const target = updated ?? existing;
    const user = await this.prisma.db.orm.public.User.first({ id: target.userId });

    return {
      id: target.id,
      type: target.type as FeedbackTicket["type"],
      status: target.status as FeedbackTicket["status"],
      title: target.title,
      description: target.description,
      clientMetadata: target.clientMetadata as FeedbackTicket["clientMetadata"],
      adminNotes: target.adminNotes ?? null,
      userId: target.userId,
      user: user ? { id: user.id, username: user.username, email: user.email } : undefined,
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
    };
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const existing = await this.prisma.db.orm.public.FeedbackTicket.first({ id });
    if (!existing) {
      throw new NotFoundException("Feedback ticket not found");
    }

    await this.prisma.db.orm.public.FeedbackTicket.where({ id }).delete();

    return { success: true, id };
  }
}
