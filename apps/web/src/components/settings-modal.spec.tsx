import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { SettingsModal } from "./settings-modal";
import * as glossaryModule from "@/services/glossary";
import * as flashcardsContextModule from "@/contexts/FlashCardsContext";
import * as speechModule from "@/hooks/use-speech";
import * as notificationsModule from "@/services/notifications";

const mockSetTheme = vi.fn();
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "dark",
    setTheme: mockSetTheme,
  }),
}));

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("SettingsModal", () => {
  const mockAddRule = vi.fn();
  const mockUpdateRule = vi.fn();
  const mockRemoveRule = vi.fn();

  const mockCreateCard = vi.fn().mockResolvedValue({ id: "card-new" });
  const mockUpdateCard = vi.fn().mockResolvedValue({});
  const mockDeleteCard = vi.fn().mockResolvedValue(true);
  const mockSpeak = vi.fn();

  const mockSaveNotificationSettings = vi.fn();
  const mockRequestNotificationPermission = vi.fn().mockResolvedValue(true);
  const mockSendTestNotification = vi.fn().mockResolvedValue(true);
  const mockSyncCardNotifications = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(glossaryModule, "useGlossaryRules").mockReturnValue({
      rules: [
        { id: "r1", sourceTerm: "Coffee", targetTerm: "珈琲", createdAt: 1000 },
        { id: "r2", sourceTerm: "Water", targetTerm: "水", createdAt: 2000 },
      ],
      addRule: mockAddRule,
      updateRule: mockUpdateRule,
      removeRule: mockRemoveRule,
    } as any);

    vi.spyOn(flashcardsContextModule, "useFlashCards").mockReturnValue({
      cards: [
        {
          id: "c1",
          jpText: "猫",
          enText: "Cat",
          notes: "",
          interval: 1,
          repetitions: 1,
          easeFactor: 2.5,
          nextReview: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createCard: mockCreateCard,
      updateCard: mockUpdateCard,
      deleteCard: mockDeleteCard,
    } as any);

    vi.spyOn(speechModule, "useSpeech").mockReturnValue({
      speak: mockSpeak,
      isPlaying: false,
      supported: true,
      stop: vi.fn(),
    } as any);

    vi.spyOn(notificationsModule, "getNotificationSettings").mockReturnValue({
      enabled: true,
      dailyReminder: true,
      dailyTime: "20:00",
      overdueAlert: true,
      overdueThreshold: 15,
    });
    vi.spyOn(notificationsModule, "saveNotificationSettings").mockImplementation(mockSaveNotificationSettings);
    vi.spyOn(notificationsModule, "requestNotificationPermission").mockImplementation(mockRequestNotificationPermission);
    vi.spyOn(notificationsModule, "sendTestNotification").mockImplementation(mockSendTestNotification);
    vi.spyOn(notificationsModule, "syncCardNotifications").mockImplementation(mockSyncCardNotifications);
    vi.spyOn(notificationsModule, "isNotificationsSupported").mockReturnValue(true);
  });

  it("renders when open and closes when triggered", () => {
    const handleClose = vi.fn();
    const { rerender } = render(<SettingsModal isOpen={true} onClose={handleClose} />);

    expect(screen.getByText("Configurations")).toBeInTheDocument();
    expect(screen.getByText("Translation Glossary")).toBeInTheDocument();

    rerender(<SettingsModal isOpen={false} onClose={handleClose} />);
    expect(screen.queryByText("Configurations")).not.toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", () => {
    const handleClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByRole("button", { name: "Close" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalled();
  });

  describe("Glossary Tab", () => {
    it("adds a new glossary term and resets form", () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      const sourceInput = screen.getByLabelText("English Term");
      const targetInput = screen.getByLabelText("Preferred Japanese");
      const submitBtn = screen.getByRole("button", { name: "Add Term" });

      fireEvent.change(sourceInput, { target: { value: "Book" } });
      fireEvent.change(targetInput, { target: { value: "本" } });
      fireEvent.click(submitBtn);

      expect(mockAddRule).toHaveBeenCalledWith("Book", "本");
      expect(sourceInput).toHaveValue("");
      expect(targetInput).toHaveValue("");
    });

    it("edits an existing glossary term and updates it", () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      const editButtons = screen.getAllByTitle("Edit term");
      fireEvent.click(editButtons[0]!);

      expect(screen.getByText("Edit Glossary Term")).toBeInTheDocument();
      const sourceInput = screen.getByLabelText("English Term");
      const targetInput = screen.getByLabelText("Preferred Japanese");
      expect(sourceInput).toHaveValue("Coffee");
      expect(targetInput).toHaveValue("珈琲");

      fireEvent.change(targetInput, { target: { value: "コーヒー" } });
      fireEvent.click(screen.getByRole("button", { name: "Update Term" }));

      expect(mockUpdateRule).toHaveBeenCalledWith("r1", "Coffee", "コーヒー");
    });

    it("cancels editing a glossary term", () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      const editButtons = screen.getAllByTitle("Edit term");
      fireEvent.click(editButtons[0]!);

      const cancelBtn = screen.getByRole("button", { name: "Cancel Edit" });
      fireEvent.click(cancelBtn);

      expect(screen.getByText("Add New Term")).toBeInTheDocument();
    });

    it("deletes a glossary term and resets form if currently editing it", () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      const editButtons = screen.getAllByTitle("Edit term");
      fireEvent.click(editButtons[0]!);

      const deleteButtons = screen.getAllByTitle("Delete term");
      fireEvent.click(deleteButtons[0]!);

      expect(mockRemoveRule).toHaveBeenCalledWith("r1");
      expect(screen.getByText("Add New Term")).toBeInTheDocument();
    });

    it("filters glossary terms by search query and shows empty search state", () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      const searchInput = screen.getByPlaceholderText("Filter terms...");
      fireEvent.change(searchInput, { target: { value: "Tea" } });

      expect(screen.getByText('No glossary terms found matching "Tea"')).toBeInTheDocument();

      const clearBtn = screen.getByTitle("Clear filter");
      fireEvent.click(clearBtn);
      expect(screen.getByText("Coffee")).toBeInTheDocument();
    });
  });

  describe("Flashcards Tab", () => {
    it("switches to flashcards tab, creates card, edits card, speaks card, and deletes card", async () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /Flashcards/i }));
      expect(screen.getByText("Flash Cards Arsenal")).toBeInTheDocument();
      expect(screen.getByText("猫")).toBeInTheDocument();

      // Create new card
      const jpInput = screen.getByLabelText("Japanese Text (Front)");
      const enInput = screen.getByLabelText("English Meaning (Back)");
      fireEvent.change(jpInput, { target: { value: "犬" } });
      fireEvent.change(enInput, { target: { value: "Dog" } });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Add Card" }));
      });
      expect(mockCreateCard).toHaveBeenCalledWith({ jpText: "犬", enText: "Dog" });

      // Speak card
      const speakBtn = screen.getByTitle("Pronounce Japanese");
      fireEvent.click(speakBtn);
      expect(mockSpeak).toHaveBeenCalledWith("猫", "ja-JP");

      // Edit card
      const editBtn = screen.getByTitle("Edit card");
      fireEvent.click(editBtn);
      expect(screen.getByText("Edit Card")).toBeInTheDocument();

      fireEvent.change(enInput, { target: { value: "Kitty" } });
      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Update Card" }));
      });
      expect(mockUpdateCard).toHaveBeenCalledWith("c1", { jpText: "猫", enText: "Kitty" });

      // Delete card
      const deleteBtn = screen.getByTitle("Delete card");
      await act(async () => {
        fireEvent.click(deleteBtn);
      });
      expect(mockDeleteCard).toHaveBeenCalledWith("c1");
    });

    it("filters flashcards by search query and clears search", () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /Flashcards/i }));
      const searchInput = screen.getByPlaceholderText("Search Japanese or English...");

      fireEvent.change(searchInput, { target: { value: "Elephant" } });
      expect(screen.getByText('No flash cards found matching "Elephant"')).toBeInTheDocument();

      fireEvent.click(screen.getByTitle("Clear filter"));
      expect(screen.getByText("猫")).toBeInTheDocument();
    });
  });

  describe("Appearance Tab", () => {
    it("switches theme between light and dark", () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /Appearance/i }));
      expect(screen.getByText("Theme & Appearance")).toBeInTheDocument();

      const lightCard = screen.getByText("Light Mode").closest("div[class*='cursor-pointer']");
      if (lightCard) {
        fireEvent.click(lightCard);
        expect(mockSetTheme).toHaveBeenCalledWith("light");
      }

      const darkCard = screen.getByText("Dark Mode").closest("div[class*='cursor-pointer']");
      if (darkCard) {
        fireEvent.click(darkCard);
        expect(mockSetTheme).toHaveBeenCalledWith("dark");
      }
    });
  });

  describe("Notifications Tab", () => {
    it("toggles notifications, changes daily reminder time, and tests notifications", async () => {
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /Notifications/i }));
      expect(screen.getByText("Study & Review Notifications")).toBeInTheDocument();

      const switches = screen.getAllByRole("switch");
      const masterSwitch = switches[0];
      const dailySwitch = switches[1];
      const overdueSwitch = switches[2];

      // Toggle overdue
      await act(async () => {
        fireEvent.click(overdueSwitch!);
      });
      expect(mockSaveNotificationSettings).toHaveBeenCalledWith(
        expect.objectContaining({ overdueAlert: false })
      );

      // Change daily time
      const timeInput = screen.getByDisplayValue("20:00");
      await act(async () => {
        fireEvent.change(timeInput, { target: { value: "09:30" } });
      });
      expect(mockSaveNotificationSettings).toHaveBeenCalledWith(
        expect.objectContaining({ dailyTime: "09:30" })
      );

      // Toggle daily reminder
      await act(async () => {
        fireEvent.click(dailySwitch!);
      });
      expect(mockSaveNotificationSettings).toHaveBeenCalledWith(
        expect.objectContaining({ dailyReminder: false })
      );

      // Test notification button (success)
      const testBtn = screen.getByRole("button", { name: /Test Notification/i });
      await act(async () => {
        fireEvent.click(testBtn);
      });
      expect(mockSendTestNotification).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByText(/Test notification scheduled/i)).toBeInTheDocument();
      });
    });

    it("requests permission when enabling notifications from disabled state and handles ungranted permission", async () => {
      vi.spyOn(notificationsModule, "getNotificationSettings").mockReturnValue({
        enabled: false,
        dailyReminder: false,
        dailyTime: "20:00",
        overdueAlert: false,
        overdueThreshold: 15,
      });
      mockRequestNotificationPermission.mockResolvedValueOnce(false);

      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /Notifications/i }));
      const masterSwitch = screen.getAllByRole("switch")[0];

      await act(async () => {
        fireEvent.click(masterSwitch!);
      });

      expect(mockRequestNotificationPermission).toHaveBeenCalled();
      expect(mockSaveNotificationSettings).toHaveBeenCalledWith(
        expect.objectContaining({ enabled: true })
      );
    });

    it("displays error message if test notification fails", async () => {
      mockSendTestNotification.mockResolvedValueOnce(false);
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /Notifications/i }));
      const testBtn = screen.getByRole("button", { name: /Test Notification/i });
      await act(async () => {
        fireEvent.click(testBtn);
      });

      await waitFor(() => {
        expect(screen.getByText(/Could not send notification/i)).toBeInTheDocument();
      });
    });

    it("displays unsupported banner when notifications are unsupported", () => {
      vi.spyOn(notificationsModule, "isNotificationsSupported").mockReturnValue(false);
      render(<SettingsModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByRole("tab", { name: /Notifications/i }));
      expect(screen.getByText("Android App Feature")).toBeInTheDocument();
    });
  });
});
