import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ServerWakeupOverlay } from "./server-wakeup-overlay";

const mockSetIsWakingServer = vi.fn();
const mockLogout = vi.fn();
const mockSetUser = vi.fn();

let mockAuthState = {
  isWakingServer: true,
  hasInitialToken: true,
  setIsWakingServer: mockSetIsWakingServer,
  logout: mockLogout,
  setUser: mockSetUser,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("@/actions/auth", () => ({
  validateSessionAction: vi.fn(),
}));

describe("ServerWakeupOverlay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthState = {
      isWakingServer: true,
      hasInitialToken: true,
      setIsWakingServer: mockSetIsWakingServer,
      logout: mockLogout,
      setUser: mockSetUser,
    };
  });

  it("renders null if hasInitialToken is false", () => {
    mockAuthState.hasInitialToken = false;
    const { container } = render(<ServerWakeupOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders null if isWakingServer is false", () => {
    mockAuthState.isWakingServer = false;
    const { container } = render(<ServerWakeupOverlay />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders connecting message and spinner when waking with initial token", () => {
    // Mock fetch pending
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {}));

    render(<ServerWakeupOverlay />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Conectando ao servidor...")).toBeInTheDocument();
    expect(
      screen.getByText(/Estamos inicializando o servidor gratuito/i)
    ).toBeInTheDocument();
  });

  it("wakes up and sets user if session is valid", async () => {
    const { validateSessionAction } = await import("@/actions/auth");
    (validateSessionAction as any).mockResolvedValue({
      status: "valid",
      user: { sub: "123", username: "sakura" },
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    render(<ServerWakeupOverlay />);

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith({ sub: "123", username: "sakura" });
      expect(mockSetIsWakingServer).toHaveBeenCalledWith(false);
    });
  });

  it("wakes up and logs out if session is invalid", async () => {
    const { validateSessionAction } = await import("@/actions/auth");
    (validateSessionAction as any).mockResolvedValue({
      status: "invalid",
      reason: "Token expired or invalid",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });

    render(<ServerWakeupOverlay />);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockSetIsWakingServer).toHaveBeenCalledWith(false);
    });
  });
});
