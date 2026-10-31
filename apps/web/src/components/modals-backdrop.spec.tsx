import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act } from "@testing-library/react";
import { ProfileModal } from "./profile-modal";
import { SettingsModal } from "./settings-modal";
import { Dialog, DialogContent } from "./ui/dialog";

// Mock auth context
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: {
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
    },
    logout: vi.fn(),
  }),
}));

// Mock user actions
vi.mock("@/actions/user", () => ({
  getUserProfileAction: vi.fn().mockResolvedValue({
    githubUsername: "testuser",
    isSupporter: false,
    isActiveSupporter: false,
    tierName: null,
  }),
  updateGithubUsernameAction: vi.fn().mockResolvedValue({ success: true }),
  changePasswordAction: vi.fn().mockResolvedValue({ success: true }),
  deleteAccountAction: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock settings dependencies
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", setTheme: vi.fn() }),
}));

vi.mock("@/services/glossary", () => ({
  useGlossaryRules: () => ({
    rules: [],
    addRule: vi.fn(),
    deleteRule: vi.fn(),
    updateRule: vi.fn(),
  }),
}));

vi.mock("@/contexts/FlashCardsContext", () => ({
  useFlashCards: () => ({
    decks: [],
    cards: [],
  }),
}));

vi.mock("@/hooks/use-speech", () => ({
  useSpeech: () => ({
    speak: vi.fn(),
    speaking: false,
    supported: true,
  }),
}));

vi.mock("@/services/notifications", () => ({
  getNotificationSettings: vi.fn().mockReturnValue({
    enabled: true,
    dailyReminder: true,
    dailyTime: "20:00",
    overdueAlert: true,
    overdueIntervalHours: 4,
    studyReminders: true,
    smartStudyPrompts: true,
    streakProtectionAlerts: true,
  }),
  saveNotificationSettings: vi.fn(),
  requestNotificationPermission: vi.fn().mockResolvedValue("granted"),
  sendTestNotification: vi.fn().mockResolvedValue(true),
  syncCardNotifications: vi.fn().mockResolvedValue(undefined),
  isNotificationsSupported: vi.fn().mockReturnValue(true),
}));

describe("Modal Backdrop Blur & Dimming", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders ProfileModal with backdrop-blur-md and bg-black/60", async () => {
    await act(async () => {
      render(<ProfileModal isOpen={true} onClose={vi.fn()} />);
    });

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.className).toContain("backdrop-blur-md");
    expect(overlay?.className).toContain("bg-black/60");
    expect(overlay?.className).toContain("fixed");
    expect(overlay?.className).toContain("inset-0");
  });

  it("renders SettingsModal with backdrop-blur-md and bg-black/60", async () => {
    await act(async () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);
    });

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.className).toContain("backdrop-blur-md");
    expect(overlay?.className).toContain("bg-black/60");
    expect(overlay?.className).toContain("fixed");
    expect(overlay?.className).toContain("inset-0");
  });

  it("supports custom overlayClassName on DialogContent", () => {
    render(
      <Dialog open={true}>
        <DialogContent overlayClassName="custom-blur-class">
          <div>Content</div>
        </DialogContent>
      </Dialog>
    );

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).toBeInTheDocument();
    expect(overlay?.className).toContain("custom-blur-class");
    expect(overlay?.className).toContain("backdrop-blur-md");
  });

  it("does not render backdrop overlay when isOpen is false", () => {
    render(<ProfileModal isOpen={false} onClose={vi.fn()} />);

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeInTheDocument();
  });
});
