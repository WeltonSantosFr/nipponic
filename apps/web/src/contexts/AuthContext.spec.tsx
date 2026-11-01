import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "./AuthContext";
import * as authActions from "../actions/auth";
import { jwtDecode } from "jwt-decode";
import type { UserPayload } from "@nipponic/shared";

vi.mock("../actions/auth", () => ({
  saveAuthCookie: vi.fn(),
  removeAuthCookie: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(),
}));

describe("AuthContext", () => {
  const mockUser: UserPayload = {
    sub: "user-123",
    username: "testuser",
    email: "test@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initializes with initialUser correctly", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={mockUser}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isWakingServer).toBe(true);
    expect(result.current.hasInitialToken).toBe(true);
  });

  it("sets isWakingServer to false when offline on mount", () => {
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={mockUser}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isWakingServer).toBe(false);
  });

  it("restores session from localStorage when initialUser is null", async () => {
    vi.mocked(authActions.saveAuthCookie).mockResolvedValue(undefined as any);
    localStorage.setItem("nipponic.token", "valid-jwt-token");
    localStorage.setItem("nipponic.user", JSON.stringify(mockUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={null}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(authActions.saveAuthCookie).toHaveBeenCalledWith("valid-jwt-token");
    });
  });

  it("handles saveAuthCookie rejection gracefully during session restore", async () => {
    vi.mocked(authActions.saveAuthCookie).mockRejectedValue(new Error("Cookie sync failed"));
    localStorage.setItem("nipponic.token", "valid-jwt-token");
    localStorage.setItem("nipponic.user", JSON.stringify(mockUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={null}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it("cleans up orphaned user in localStorage when token is missing", async () => {
    localStorage.setItem("nipponic.user", JSON.stringify(mockUser));
    // No nipponic.token in localStorage

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={null}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem("nipponic.user")).toBeNull();
    });
  });

  it("handles localStorage read errors gracefully on mount", async () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Security / Storage blocked");
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={null}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);

    getItemSpy.mockRestore();
  });

  it("logs in successfully: saves cookie, decodes JWT, stores in localStorage and clears waking state", async () => {
    vi.mocked(authActions.saveAuthCookie).mockResolvedValue(undefined as any);
    vi.mocked(jwtDecode).mockReturnValue(mockUser as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={null}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login("fake-jwt-token");
    });

    expect(authActions.saveAuthCookie).toHaveBeenCalledWith("fake-jwt-token");
    expect(jwtDecode).toHaveBeenCalledWith("fake-jwt-token");
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.isWakingServer).toBe(false);
    expect(localStorage.getItem("nipponic.token")).toBe("fake-jwt-token");
    expect(localStorage.getItem("nipponic.user")).toBe(JSON.stringify(mockUser));
  });

  it("handles localStorage write error gracefully during login", async () => {
    vi.mocked(authActions.saveAuthCookie).mockResolvedValue(undefined as any);
    vi.mocked(jwtDecode).mockReturnValue(mockUser as any);

    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={null}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.login("fake-token")).resolves.not.toThrow();
    });

    expect(result.current.user).toEqual(mockUser);
    setItemSpy.mockRestore();
  });

  it("logs out successfully: removes cookie, clears user, clears localStorage", async () => {
    vi.mocked(authActions.removeAuthCookie).mockResolvedValue(undefined as any);
    localStorage.setItem("nipponic.token", "active-token");
    localStorage.setItem("nipponic.user", JSON.stringify(mockUser));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={mockUser}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => {
      await result.current.logout();
    });

    expect(authActions.removeAuthCookie).toHaveBeenCalledTimes(1);
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.isWakingServer).toBe(false);
    expect(localStorage.getItem("nipponic.token")).toBeNull();
    expect(localStorage.getItem("nipponic.user")).toBeNull();
  });

  it("handles localStorage remove error gracefully during logout", async () => {
    vi.mocked(authActions.removeAuthCookie).mockResolvedValue(undefined as any);

    const removeItemSpy = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("Storage permission denied");
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={mockUser}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await expect(result.current.logout()).resolves.not.toThrow();
    });

    expect(result.current.user).toBeNull();
    removeItemSpy.mockRestore();
  });

  it("allows setting user and isWakingServer directly", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider initialUser={null}>{children}</AuthProvider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setUser(mockUser);
      result.current.setIsWakingServer(true);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isWakingServer).toBe(true);
  });
});
