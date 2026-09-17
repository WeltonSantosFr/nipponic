import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginModal } from "./login-modal";
import * as api from "@/services/api";

const mockLogin = vi.fn();
const mockOnClose = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

vi.mock("@/services/api", () => ({
  login: vi.fn(),
  registerUser: vi.fn(),
}));

describe("LoginModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders sign in modal by default", () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sign in to your account" })).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows free cloud server wake-up notice while submitting login", async () => {
    let resolveLogin: (val: any) => void = () => {};
    vi.mocked(api.login).mockImplementation(
      () => new Promise((resolve) => { resolveLogin = resolve; })
    );

    const { container } = render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByTestId("login-submit-button");
    fireEvent.click(submitBtn);

    // Should display notice explaining free server wakeup
    expect(screen.getByTestId("server-waking-notice")).toBeInTheDocument();
    expect(
      screen.getByText(/The free cloud server may still be waking up/i)
    ).toBeInTheDocument();
    expect(screen.getByTestId("login-submit-button")).toBeDisabled();

    // Complete login
    resolveLogin({ access_token: "token-123" });

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith("token-123");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("shows error with try again instruction if login request fails", async () => {
    vi.mocked(api.login).mockRejectedValue(new Error("Failed to fetch"));

    const { container } = render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });

    const submitBtn = screen.getByTestId("login-submit-button");
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Failed to fetch\. Please try again\./i)).toBeInTheDocument();
    });
  });

  it("shows wake-up notice and creates account during registration", async () => {
    vi.mocked(api.registerUser).mockResolvedValue({ id: "1", username: "kenji", email: "kenji@example.com" } as any);
    vi.mocked(api.login).mockResolvedValue({ access_token: "token-abc" });

    render(<LoginModal isOpen={true} onClose={mockOnClose} initialMode="register" />);

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "kenji" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "kenji@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "password123" },
    });

    const regSubmitBtn = screen.getByTestId("login-submit-button");
    fireEvent.click(regSubmitBtn);

    await waitFor(() => {
      expect(api.registerUser).toHaveBeenCalledWith({
        username: "kenji",
        email: "kenji@example.com",
        password: "password123",
      });
      expect(mockLogin).toHaveBeenCalledWith("token-abc");
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

});
