import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AdminKanban } from "./admin-kanban";
import {
  updateAdminTicketAction,
  deleteAdminTicketAction,
} from "@/actions/feedback";
import type { FeedbackTicket } from "@nipponic/shared";

vi.mock("@/actions/feedback", () => ({
  updateAdminTicketAction: vi.fn(),
  deleteAdminTicketAction: vi.fn(),
}));

const mockTickets: FeedbackTicket[] = [
  {
    id: "tkt-1",
    type: "BUG",
    status: "OPEN",
    title: "Audio button broken",
    description: "Sound does not play when clicked on lesson 1",
    clientMetadata: {
      os: "Linux",
      browser: "Chrome",
      viewport: "1920x1080",
      pathname: "/tutor",
    },
    adminNotes: "Investigating player logic",
    userId: "usr-1",
    user: {
      id: "usr-1",
      username: "tanaka_taro",
      email: "tanaka@example.com",
    },
    createdAt: "2026-11-09T10:00:00.000Z",
    updatedAt: "2026-11-09T10:00:00.000Z",
  },
  {
    id: "tkt-2",
    type: "SUGGESTION",
    status: "IN_PROGRESS",
    title: "Add dark mode toggle",
    description: "Automatic dark theme toggle in configurations",
    clientMetadata: null,
    adminNotes: null,
    userId: "usr-2",
    user: {
      id: "usr-2",
      username: "sakura_flower",
      email: "sakura@example.com",
    },
    createdAt: "2026-11-09T11:00:00.000Z",
    updatedAt: "2026-11-09T11:00:00.000Z",
  },
];

describe("AdminKanban", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 4 kanban columns and distributes tickets properly", () => {
    render(<AdminKanban initialTickets={mockTickets} />);

    // Check columns
    expect(screen.getAllByText("Open").length).toBeGreaterThan(0);
    expect(screen.getAllByText("In Progress").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Resolved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Closed").length).toBeGreaterThan(0);

    // Tickets are visible
    expect(screen.getByText("Audio button broken")).toBeInTheDocument();
    expect(screen.getByText("Add dark mode toggle")).toBeInTheDocument();
  });

  it("filters tickets by search query", () => {
    render(<AdminKanban initialTickets={mockTickets} />);

    const searchInput = screen.getByPlaceholderText(/Search tickets/i);
    fireEvent.change(searchInput, { target: { value: "audio" } });

    expect(screen.getByText("Audio button broken")).toBeInTheDocument();
    expect(screen.queryByText("Add dark mode toggle")).not.toBeInTheDocument();
  });

  it("filters tickets by category button", () => {
    render(<AdminKanban initialTickets={mockTickets} />);

    // Click on "Bugs" filter
    const bugFilterBtn = screen.getByRole("button", { name: "Bugs" });
    fireEvent.click(bugFilterBtn);

    expect(screen.getByText("Audio button broken")).toBeInTheDocument();
    expect(screen.queryByText("Add dark mode toggle")).not.toBeInTheDocument();
  });

  it("opens ticket detail modal with author info and device metadata", () => {
    render(<AdminKanban initialTickets={mockTickets} />);

    const card = screen.getByText("Audio button broken");
    fireEvent.click(card);

    // Modal opens
    expect(screen.getByText("Ticket Status")).toBeInTheDocument();
    expect(screen.getAllByText(/tanaka_taro/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/tanaka@example.com/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Linux/)).toBeInTheDocument();
    expect(screen.getByText(/1920x1080/)).toBeInTheDocument();
  });

  it("updates ticket status when clicking a new status in modal", async () => {
    vi.mocked(updateAdminTicketAction).mockResolvedValue({
      success: true,
      ticket: { ...mockTickets[0], status: "RESOLVED" } as FeedbackTicket,
    });

    render(<AdminKanban initialTickets={mockTickets} />);

    const card = screen.getByText("Audio button broken");
    fireEvent.click(card);

    // In modal, click "Resolved" button
    const resolvedButtons = screen.getAllByRole("button", { name: "Resolved" });
    const modalResolvedBtn = resolvedButtons[resolvedButtons.length - 1];
    expect(modalResolvedBtn).toBeDefined();
    if (modalResolvedBtn) {
      fireEvent.click(modalResolvedBtn);
    }

    await waitFor(() => {
      expect(updateAdminTicketAction).toHaveBeenCalledWith("tkt-1", { status: "RESOLVED" });
    });
  });

  it("saves admin internal notes", async () => {
    vi.mocked(updateAdminTicketAction).mockResolvedValue({
      success: true,
      ticket: { ...mockTickets[0], adminNotes: "Fixed in PR #42" } as FeedbackTicket,
    });

    render(<AdminKanban initialTickets={mockTickets} />);

    fireEvent.click(screen.getByText("Audio button broken"));

    const notesTextarea = screen.getByPlaceholderText(/Add private internal notes/i);
    fireEvent.change(notesTextarea, { target: { value: "Fixed in PR #42" } });

    const saveBtn = screen.getByRole("button", { name: /Save Notes/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateAdminTicketAction).toHaveBeenCalledWith("tkt-1", {
        adminNotes: "Fixed in PR #42",
      });
    });
  });

  it("deletes ticket after confirmation", async () => {
    vi.mocked(deleteAdminTicketAction).mockResolvedValue({ success: true });

    render(<AdminKanban initialTickets={mockTickets} />);

    fireEvent.click(screen.getByText("Audio button broken"));

    const deleteBtn = screen.getByRole("button", { name: /Delete Ticket/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Permanently Delete Ticket?")).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirm Delete/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(deleteAdminTicketAction).toHaveBeenCalledWith("tkt-1");
    });
  });
});
