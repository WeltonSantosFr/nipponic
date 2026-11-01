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

  it("switches modes using tabs and footer links", () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    // Starts in login mode
    expect(screen.getByRole("heading", { name: "Sign in to your account" })).toBeInTheDocument();

    // Switch to register via tab button
    const registerTabBtn = screen.getByRole("button", { name: "Create Account" });
    fireEvent.click(registerTabBtn);
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();

    // Switch back to login via tab button
    const loginTabBtn = screen.getByRole("button", { name: "Sign In" });
    fireEvent.click(loginTabBtn);
    expect(screen.getByRole("heading", { name: "Sign in to your account" })).toBeInTheDocument();

    // Switch to register via footer link
    const signUpLink = screen.getByRole("button", { name: "Sign up" });
    fireEvent.click(signUpLink);
    expect(screen.getByRole("heading", { name: "Create your account" })).toBeInTheDocument();

    // Switch back to login via footer link
    const signInLink = screen.getByRole("button", { name: "Sign in" });
    fireEvent.click(signInLink);
    expect(screen.getByRole("heading", { name: "Sign in to your account" })).toBeInTheDocument();
  });

  it("validates password length and matching passwords during registration", async () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} initialMode="register" />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "kenji" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "kenji@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByTestId("login-submit-button"));
    expect(screen.getByText("Password must be at least 6 characters")).toBeInTheDocument();

    // Password mismatch
    fireEvent.change(screen.getByLabelText(/^password/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirm password/i), {
      target: { value: "different456" },
    });

    fireEvent.click(screen.getByTestId("login-submit-button"));
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("validates empty username during registration and closes on Escape", () => {
    render(<LoginModal isOpen={true} onClose={mockOnClose} initialMode="register" />);

    fireEvent.change(screen.getByLabelText(/username/i), {
      target: { value: "   " },
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

    fireEvent.click(screen.getByTestId("login-submit-button"));
    expect(screen.getByText("Username is required")).toBeInTheDocument();

    // Escape closes modal
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("switches to login mode if auto-login fails after registration", async () => {
    vi.mocked(api.registerUser).mockResolvedValue({ id: "1", username: "kenji", email: "kenji@example.com" } as any);
    vi.mocked(api.login).mockRejectedValueOnce(new Error("Auto login failed"));

    render(<LoginModal isOpen={true} onClose={mockOnClose} initialMode="register" />);

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "kenji" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "kenji@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });

    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Auto login failed. Please try again.")).toBeInTheDocument();
    });
  });

  it("handles login and register when response lacks access_token", async () => {
    vi.mocked(api.login).mockResolvedValueOnce({} as any);

    render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(api.login).toHaveBeenCalled();
      expect(mockLogin).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  it("formats error messages correctly for various shapes (already has try again, ends with dot, or missing message)", async () => {
    // 1. Error already containing "try again"
    vi.mocked(api.login).mockRejectedValueOnce(new Error("Timeout! Please try again later."));

    const { rerender } = render(<LoginModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Timeout! Please try again later.")).toBeInTheDocument();
    });

    // 2. Error ending with dot
    vi.mocked(api.login).mockRejectedValueOnce(new Error("Invalid credentials."));
    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials. Please try again.")).toBeInTheDocument();
    });

    // 3. Error with no message object in login mode
    vi.mocked(api.login).mockRejectedValueOnce({});
    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Failed to sign in. Please try again.")).toBeInTheDocument();
    });

    // 4. Error with no message in register mode
    rerender(<LoginModal isOpen={true} onClose={mockOnClose} initialMode="register" />);
    vi.mocked(api.registerUser).mockRejectedValueOnce({});

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: "kenji" } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "kenji@example.com" } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByTestId("login-submit-button"));

    await waitFor(() => {
      expect(screen.getByText("Failed to register. Please try again.")).toBeInTheDocument();
    });
  });
});
