import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SponsorsPage from "./page";
import * as sponsorsActions from "@/actions/sponsors";
import type { Sponsor } from "@nipponic/shared";

vi.mock("@/components/supporter-badge", () => ({
  SupporterBadge: ({ isSupporter, tierName }: any) => (
    <div data-testid="mock-supporter-badge">
      Badge: {tierName} ({isSupporter ? "Active" : "Inactive"})
    </div>
  ),
}));

describe("SponsorsPage (app/sponsors/page.tsx)", () => {
  const mockSponsors: Sponsor[] = [
    {
      id: "s1",
      githubUsername: "alice",
      name: "Alice Tanaka",
      avatarUrl: "https://example.com/alice.png",
      tierName: "🌱 Green Tea",
      monthlyPriceInCents: 100,
      isOneTime: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: "s2",
      githubUsername: "bob",
      name: "",
      avatarUrl: "",
      tierName: "🍜 Ramen",
      monthlyPriceInCents: 500,
      isOneTime: false,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(sponsorsActions, "getPublicSponsorsAction").mockResolvedValue(mockSponsors);
    vi.spyOn(sponsorsActions, "mockSponsorAction").mockResolvedValue({
      success: true,
      message: "Success",
    } as any);
    vi.spyOn(sponsorsActions, "clearMockSponsorsAction").mockResolvedValue({
      success: true,
      message: "Cleared",
    } as any);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders page header, manifesto pillars, and support tiers", async () => {
    render(<SponsorsPage />);

    expect(screen.getByText("Back to Nipponic")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Support the Nipponic Ecosystem/i })).toBeInTheDocument();
    expect(screen.getByText("Zero Paywalled Features")).toBeInTheDocument();
    expect(screen.getByText("Heartfelt Recognition")).toBeInTheDocument();

    // Tiers
    expect(screen.getByText("Green Tea (Sencha)")).toBeInTheDocument();
    expect(screen.getByText("Bento Box")).toBeInTheDocument();
    expect(screen.getByText("Ramen")).toBeInTheDocument();
    expect(screen.getByText("One-Time Donation")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alice Tanaka")).toBeInTheDocument();
    });
  });

  it("renders list of sponsors and handles avatar fallback error", async () => {
    render(<SponsorsPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Tanaka")).toBeInTheDocument();
      expect(screen.getByText("@alice")).toBeInTheDocument();
      // bob has no name, so githubUsername is displayed as name
      expect(screen.getByText("@bob")).toBeInTheDocument();
    });

    const images = screen.getAllByRole("img");
    const bobImg = images.find((img) => img.getAttribute("alt") === "bob");
    expect(bobImg).toBeDefined();

    // Trigger onError
    fireEvent.error(bobImg!);
    expect(bobImg?.getAttribute("src")).toBe("https://avatar.vercel.sh/bob");
  });

  it("renders empty state when there are 0 sponsors", async () => {
    vi.spyOn(sponsorsActions, "getPublicSponsorsAction").mockResolvedValue([]);

    render(<SponsorsPage />);

    await waitFor(() => {
      expect(screen.getByText("Be the First Patron of Nipponic!")).toBeInTheDocument();
    });
  });

  it("refreshes sponsors when Refresh Wall button is clicked", async () => {
    render(<SponsorsPage />);

    await waitFor(() => {
      expect(screen.getByText("Alice Tanaka")).toBeInTheDocument();
    });

    const refreshBtn = screen.getByRole("button", { name: /Refresh Wall/i });
    fireEvent.click(refreshBtn);

    expect(sponsorsActions.getPublicSponsorsAction).toHaveBeenCalledTimes(2);
  });

  it("handles fetchSponsors network error gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(sponsorsActions, "getPublicSponsorsAction").mockRejectedValue(new Error("Network drop"));

    render(<SponsorsPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  describe("Developer Sandbox", () => {
    beforeEach(() => {
      (process.env as any).NODE_ENV = "development";
    });

    it("renders sandbox and simulates sponsorship creation successfully", async () => {
      render(<SponsorsPage />);

      expect(screen.getByText("Local Testing Sandbox (Dev Mock)")).toBeInTheDocument();

      const usernameInput = screen.getByPlaceholderText("github-username");
      const submitBtn = screen.getByRole("button", { name: "Simulate Sponsorship" });

      // Type username
      fireEvent.change(usernameInput, { target: { value: "developer123" } });

      // Change tier to Ramen ($5)
      const selectTier = screen.getByRole("combobox");
      fireEvent.change(selectTier, { target: { value: "🍜 Ramen" } });

      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(sponsorsActions.mockSponsorAction).toHaveBeenCalledWith({
        githubUsername: "developer123",
        name: "developer123",
        tierName: "🍜 Ramen",
        monthlyPriceInCents: 500,
        isOneTime: false,
        isActive: true,
      });

      await waitFor(() => {
        expect(screen.getByText(/Mock sponsor created successfully!/i)).toBeInTheDocument();
      });
    });

    it("handles Bento Box ($3) and One-Time Donation pricing in sandbox", async () => {
      render(<SponsorsPage />);

      const usernameInput = screen.getByPlaceholderText("github-username");
      const submitBtn = screen.getByRole("button", { name: "Simulate Sponsorship" });
      const selectTier = screen.getByRole("combobox");

      // Test Bento Box ($3)
      fireEvent.change(usernameInput, { target: { value: "bento_user" } });
      fireEvent.change(selectTier, { target: { value: "🍱 Bento Box" } });
      await act(async () => {
        fireEvent.click(submitBtn);
      });
      expect(sponsorsActions.mockSponsorAction).toHaveBeenCalledWith(
        expect.objectContaining({ monthlyPriceInCents: 300 })
      );

      // Test One-Time Donation
      fireEvent.change(usernameInput, { target: { value: "onetime_user" } });
      fireEvent.change(selectTier, { target: { value: "✨ One-Time Donation" } });
      await act(async () => {
        fireEvent.click(submitBtn);
      });
      expect(sponsorsActions.mockSponsorAction).toHaveBeenCalledWith(
        expect.objectContaining({ isOneTime: true, monthlyPriceInCents: 100 })
      );
    });

    it("displays error message if mockSponsorAction fails or throws", async () => {
      vi.spyOn(sponsorsActions, "mockSponsorAction").mockResolvedValueOnce({
        success: false,
        message: "Simulation failed on server",
      } as any);

      render(<SponsorsPage />);

      const usernameInput = screen.getByPlaceholderText("github-username");
      fireEvent.change(usernameInput, { target: { value: "fail_user" } });
      fireEvent.click(screen.getByRole("button", { name: "Simulate Sponsorship" }));

      await waitFor(() => {
        expect(screen.getByText("✗ Simulation failed on server")).toBeInTheDocument();
      });

      // Thrown exception
      vi.spyOn(sponsorsActions, "mockSponsorAction").mockRejectedValueOnce(new Error("Fatal error"));
      fireEvent.change(usernameInput, { target: { value: "throw_user" } });
      fireEvent.click(screen.getByRole("button", { name: "Simulate Sponsorship" }));

      await waitFor(() => {
        expect(screen.getByText("✗ Fatal error")).toBeInTheDocument();
      });
    });

    it("clears test sponsors when confirmed", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(<SponsorsPage />);

      const clearBtn = screen.getByRole("button", { name: "Clear Test Sponsors" });
      await act(async () => {
        fireEvent.click(clearBtn);
      });

      expect(sponsorsActions.clearMockSponsorsAction).toHaveBeenCalled();
    });

    it("cancels clear test sponsors when user declines confirmation", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      render(<SponsorsPage />);

      const clearBtn = screen.getByRole("button", { name: "Clear Test Sponsors" });
      fireEvent.click(clearBtn);

      expect(sponsorsActions.clearMockSponsorsAction).not.toHaveBeenCalled();
    });

    it("handles error during clearMockSponsorsAction", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);
      vi.spyOn(sponsorsActions, "clearMockSponsorsAction").mockResolvedValueOnce({
        success: false,
        message: "Cannot clear sponsors",
      } as any);

      render(<SponsorsPage />);

      const clearBtn = screen.getByRole("button", { name: "Clear Test Sponsors" });
      await act(async () => {
        fireEvent.click(clearBtn);
      });

      expect(screen.getByText("✗ Cannot clear sponsors")).toBeInTheDocument();

      // Test fallback message when res.message is empty
      vi.spyOn(sponsorsActions, "clearMockSponsorsAction").mockResolvedValueOnce({
        success: false,
      } as any);
      await act(async () => {
        fireEvent.click(clearBtn);
      });
      expect(screen.getByText("✗ Failed to clear mock sponsors")).toBeInTheDocument();

      // Test thrown exception
      vi.spyOn(sponsorsActions, "clearMockSponsorsAction").mockRejectedValueOnce(
        new Error("Clear exception")
      );
      await act(async () => {
        fireEvent.click(clearBtn);
      });
      expect(screen.getByText("✗ Clear exception")).toBeInTheDocument();

      // Test thrown exception with no message
      vi.spyOn(sponsorsActions, "clearMockSponsorsAction").mockRejectedValueOnce({});
      await act(async () => {
        fireEvent.click(clearBtn);
      });
      expect(screen.getByText("✗ Failed to clear mock sponsors")).toBeInTheDocument();
    });

    it("handles empty or whitespace mock username submission", async () => {
      render(<SponsorsPage />);

      const usernameInput = screen.getByPlaceholderText("github-username");
      fireEvent.change(usernameInput, { target: { value: "   " } });
      const submitBtn = screen.getByRole("button", { name: "Simulate Sponsorship" });
      
      await act(async () => {
        fireEvent.click(submitBtn);
      });

      expect(sponsorsActions.mockSponsorAction).not.toHaveBeenCalled();
    });

    it("handles mockSponsorAction failure or exception without message", async () => {
      vi.spyOn(sponsorsActions, "mockSponsorAction").mockResolvedValueOnce({
        success: false,
      } as any);

      render(<SponsorsPage />);

      const usernameInput = screen.getByPlaceholderText("github-username");
      fireEvent.change(usernameInput, { target: { value: "nomsg_user" } });
      const submitBtn = screen.getByRole("button", { name: "Simulate Sponsorship" });

      await act(async () => {
        fireEvent.click(submitBtn);
      });
      expect(screen.getByText("✗ Failed to simulate sponsorship")).toBeInTheDocument();

      // Exception without message
      vi.spyOn(sponsorsActions, "mockSponsorAction").mockRejectedValueOnce({});
      fireEvent.change(usernameInput, { target: { value: "throw_nomsg" } });
      await act(async () => {
        fireEvent.click(submitBtn);
      });
      expect(screen.getByText("✗ An unexpected error occurred while simulating sponsorship")).toBeInTheDocument();
    });
  });

  describe("Production Environment", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("does not display developer sandbox when not in development", async () => {
      vi.stubEnv("NODE_ENV", "production");
      render(<SponsorsPage />);

      expect(screen.queryByText(/Local Testing Sandbox/i)).not.toBeInTheDocument();
    });
  });
});
