import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import RootLayout, { metadata, viewport } from "../../../app/layout";

// Mock fonts
vi.mock("next/font/google", () => ({
  JetBrains_Mono: () => ({ variable: "--font-mono" }),
}));

vi.mock("next/font/local", () => ({
  default: () => ({ variable: "--font-local" }),
}));

// Mock dynamic import to execute loader
vi.mock("@/components/server-wakeup-overlay", () => ({
  ServerWakeupOverlay: () => <div data-testid="server-wakeup-overlay" />,
}));

vi.mock("next/dynamic", () => ({
  default: (loader: () => Promise<any>) => {
    loader();
    return function DynamicComponent(props: any) {
      return <div data-testid="server-wakeup-overlay" {...props} />;
    };
  },
}));

// Mock next/headers cookies
const mockGetCookie = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() =>
    Promise.resolve({
      get: mockGetCookie,
    })
  ),
}));

// Mock jwt-decode
vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

// Mock Context Providers to observe props and structure
vi.mock("@/contexts/AuthContext", () => ({
  AuthProvider: ({ children, initialUser }: any) => (
    <div data-testid="auth-provider" data-user={JSON.stringify(initialUser)}>
      {children}
    </div>
  ),
}));

vi.mock("@/contexts/NotesContext", () => ({
  NotesProvider: ({ children }: any) => (
    <div data-testid="notes-provider">{children}</div>
  ),
}));

vi.mock("@/contexts/FlashCardsContext", () => ({
  FlashCardsProvider: ({ children }: any) => (
    <div data-testid="flashcards-provider">{children}</div>
  ),
}));

vi.mock("@/contexts/TutorContext", () => ({
  TutorProvider: ({ children }: any) => (
    <div data-testid="tutor-provider">{children}</div>
  ),
}));

vi.mock("@/components/theme-provider", () => ({
  ThemeProvider: ({ children, attribute, defaultTheme }: any) => (
    <div
      data-testid="theme-provider"
      data-theme={defaultTheme}
      data-attribute={attribute}
    >
      {children}
    </div>
  ),
}));

vi.mock("@/components/capacitor-provider", () => ({
  CapacitorProvider: ({ children }: any) => (
    <div data-testid="capacitor-provider">{children}</div>
  ),
}));

describe("RootLayout (app/layout.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports metadata and viewport configurations properly", () => {
    expect(metadata.title).toBe("Nipponic");
    expect(metadata.description).toBe("Learn Japanese with ease");
    expect(metadata.metadataBase).toBeDefined();

    expect(viewport).toEqual({
      width: "device-width",
      initialScale: 1,
      maximumScale: 1,
      userScalable: false,
      viewportFit: "cover",
      themeColor: "#09090b",
    });
  });

  it("renders with initialUser null when no token cookie exists", async () => {
    mockGetCookie.mockReturnValue(undefined);

    const layout = await RootLayout({
      children: <div data-testid="test-child">Child Content</div>,
    });

    render(layout);

    expect(cookies).toHaveBeenCalled();
    expect(mockGetCookie).toHaveBeenCalledWith("nipponic.token");
    expect(jwtDecode).not.toHaveBeenCalled();

    const authProvider = screen.getByTestId("auth-provider");
    expect(authProvider).toBeInTheDocument();
    expect(authProvider.getAttribute("data-user")).toBe("null");

    expect(screen.getByTestId("notes-provider")).toBeInTheDocument();
    expect(screen.getByTestId("flashcards-provider")).toBeInTheDocument();
    expect(screen.getByTestId("tutor-provider")).toBeInTheDocument();
    expect(screen.getByTestId("theme-provider")).toBeInTheDocument();
    expect(screen.getByTestId("capacitor-provider")).toBeInTheDocument();
    expect(screen.getByTestId("server-wakeup-overlay")).toBeInTheDocument();
    expect(screen.getByTestId("test-child")).toHaveTextContent("Child Content");
  });

  it("decodes token and passes decoded user to AuthProvider when valid token cookie exists", async () => {
    const mockUser = {
      id: "u123",
      email: "user@example.com",
      username: "nippon_user",
      role: "USER",
    };
    mockGetCookie.mockReturnValue({ value: "valid.jwt.token" });
    vi.mocked(jwtDecode).mockReturnValue(mockUser as any);

    const layout = await RootLayout({
      children: <div data-testid="test-child">Authenticated Child</div>,
    });

    render(layout);

    expect(mockGetCookie).toHaveBeenCalledWith("nipponic.token");
    expect(jwtDecode).toHaveBeenCalledWith("valid.jwt.token");

    const authProvider = screen.getByTestId("auth-provider");
    expect(authProvider.getAttribute("data-user")).toBe(JSON.stringify(mockUser));
    expect(screen.getByTestId("test-child")).toHaveTextContent("Authenticated Child");
  });

  it("handles malformed or invalid JWT token gracefully without throwing", async () => {
    mockGetCookie.mockReturnValue({ value: "invalid-corrupted-token" });
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error("Invalid token signature");
    });

    const layout = await RootLayout({
      children: <div data-testid="test-child">Safe Fallback Child</div>,
    });

    render(layout);

    expect(jwtDecode).toHaveBeenCalledWith("invalid-corrupted-token");
    const authProvider = screen.getByTestId("auth-provider");
    expect(authProvider.getAttribute("data-user")).toBe("null");
    expect(screen.getByTestId("test-child")).toHaveTextContent("Safe Fallback Child");
  });
});
