import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { FeedbackModal } from "./feedback-modal";
import { submitFeedbackAction } from "@/actions/feedback";

let mockIsAuthenticated = true;
const mockUser = {
  id: "user-1",
  email: "test@example.com",
  username: "testuser",
  role: "USER",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

vi.mock("@/actions/feedback", () => ({
  submitFeedbackAction: vi.fn(),
}));

describe("FeedbackModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthenticated = true;
  });

  it("shows authentication required message when user is not authenticated", () => {
    mockIsAuthenticated = false;
    const onClose = vi.fn();
    const onOpenLogin = vi.fn();

    render(
      <FeedbackModal
        isOpen={true}
        onClose={onClose}
        onOpenLogin={onOpenLogin}
      />,
    );

    expect(screen.getByText("Authentication Required")).toBeInTheDocument();
    expect(screen.getByText(/Please sign in to your Nipponic account/i)).toBeInTheDocument();

    const signInBtn = screen.getByRole("button", { name: /sign in/i });
    fireEvent.click(signInBtn);
    expect(onOpenLogin).toHaveBeenCalledTimes(1);
  });

  it("renders form fields and handles type selection when authenticated", () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Feedback & Bug Report")).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();

    // Default category is Bug
    const ideaBtn = screen.getByRole("button", { name: /Idea/i });
    fireEvent.click(ideaBtn);
    expect(ideaBtn.className).toContain("text-indigo");
  });

  it("validates input lengths before submitting", async () => {
    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);

    const submitBtn = screen.getByRole("button", { name: /Send Ticket/i });
    fireEvent.click(submitBtn);

    // Validation prevents calling submitFeedbackAction
    expect(submitFeedbackAction).not.toHaveBeenCalled();
  });

  it("submits feedback and displays success confirmation screen", async () => {
    vi.mocked(submitFeedbackAction).mockResolvedValue({
      success: true,
      data: {
        id: "tkt-123",
        type: "BUG",
        status: "OPEN",
        title: "Audio plays slowly",
        description: "Audio player playback rate is too slow on desktop browser.",
        userId: "user-1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);

    const titleInput = screen.getByLabelText(/Title/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: "Audio plays slowly" } });
    fireEvent.change(descInput, {
      target: { value: "Audio player playback rate is too slow on desktop browser." },
    });

    const submitBtn = screen.getByRole("button", { name: /Send Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Thank you for your feedback!")).toBeInTheDocument();
    });
    expect(submitFeedbackAction).toHaveBeenCalledTimes(1);
  });

  it("displays error message if submission fails", async () => {
    vi.mocked(submitFeedbackAction).mockResolvedValue({
      success: false,
      error: "Rate limit reached: too many tickets",
    });

    render(<FeedbackModal isOpen={true} onClose={vi.fn()} />);

    const titleInput = screen.getByLabelText(/Title/i);
    const descInput = screen.getByLabelText(/Description/i);

    fireEvent.change(titleInput, { target: { value: "Audio plays slowly" } });
    fireEvent.change(descInput, {
      target: { value: "Audio player playback rate is too slow on desktop browser." },
    });

    const submitBtn = screen.getByRole("button", { name: /Send Ticket/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Rate limit reached: too many tickets");
    });
  });
});
