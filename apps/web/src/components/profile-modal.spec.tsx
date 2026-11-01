import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";

import { ProfileModal } from "./profile-modal";
import {
  changePasswordAction,
  deleteAccountAction,
  getUserProfileAction,
  updateGithubUsernameAction,
} from "@/actions/user";

let mockUser: any = {
  id: "user-1",
  email: "test@example.com",
  username: "testuser",
};
const mockLogout = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    logout: mockLogout,
  }),
}));

vi.mock("@/actions/user", () => ({
  changePasswordAction: vi.fn(),
  deleteAccountAction: vi.fn(),
  getUserProfileAction: vi.fn(),
  updateGithubUsernameAction: vi.fn(),
}));

describe("ProfileModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "user-1", email: "test@example.com", username: "testuser" };
    vi.mocked(getUserProfileAction).mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      githubUsername: "testdev",
      isSupporter: true,
      isActiveSupporter: true,
      tierName: "Supporter",
    } as any);
    vi.mocked(updateGithubUsernameAction).mockResolvedValue({
      success: true,
      user: {
        id: "user-1",
        email: "test@example.com",
        githubUsername: "newdev",
        isSupporter: true,
        isActiveSupporter: true,
        tierName: "Supporter",
      } as any,
    });
    vi.mocked(changePasswordAction).mockResolvedValue({ success: true });
    vi.mocked(deleteAccountAction).mockResolvedValue({ success: true });
    mockLogout.mockResolvedValue(undefined);
  });

  it("returns null if user is not authenticated", () => {
    mockUser = null;
    const { container } = render(<ProfileModal isOpen={true} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders profile details and supporter badge when opened", async () => {
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Account Profile")).toBeInTheDocument();
    expect(screen.getByText("test@example.com")).toBeInTheDocument();

    await waitFor(() => {
      expect(getUserProfileAction).toHaveBeenCalled();
      const input = screen.getByPlaceholderText("your-github-username") as HTMLInputElement;
      expect(input.value).toBe("testdev");
    });
  });

  it("links and updates GitHub account username", async () => {
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("testdev")).toBeInTheDocument();
    });

    const input = screen.getByDisplayValue("testdev");
    fireEvent.change(input, { target: { value: "newdev" } });

    const saveBtn = screen.getByRole("button", { name: "Save" });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateGithubUsernameAction).toHaveBeenCalledWith("newdev");
      expect(screen.getByText("GitHub account linked successfully!")).toBeInTheDocument();
    });
  });

  it("validates password length and match errors", async () => {
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    // Click "Change Password" toggle button
    const changePwdToggle = screen.getByRole("button", { name: /change password/i });
    fireEvent.click(changePwdToggle);

    const newPwdInput = screen.getByLabelText(/^new password/i);
    const confirmPwdInput = screen.getByLabelText(/^confirm new password/i);
    const saveBtn = screen.getByRole("button", { name: /save password/i });

    // Test < 6 characters
    fireEvent.change(newPwdInput, { target: { value: "123" } });
    fireEvent.change(confirmPwdInput, { target: { value: "123" } });
    fireEvent.click(saveBtn);

    expect(screen.getByText("Password must be at least 6 characters long.")).toBeInTheDocument();

    // Test mismatch
    fireEvent.change(newPwdInput, { target: { value: "password123" } });
    fireEvent.change(confirmPwdInput, { target: { value: "mismatch123" } });
    fireEvent.click(saveBtn);

    expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
  });

  it("submits valid password change and shows success", async () => {
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    const changePwdToggle = screen.getByRole("button", { name: /change password/i });
    fireEvent.click(changePwdToggle);

    const newPwdInput = screen.getByLabelText(/^new password/i);
    const confirmPwdInput = screen.getByLabelText(/^confirm new password/i);
    const saveBtn = screen.getByRole("button", { name: /save password/i });

    fireEvent.change(newPwdInput, { target: { value: "secret123" } });
    fireEvent.change(confirmPwdInput, { target: { value: "secret123" } });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(changePasswordAction).toHaveBeenCalledWith("secret123");
      expect(screen.getByText("Password updated successfully!")).toBeInTheDocument();
    });
  });

  it("handles account deletion workflow and logs out user", async () => {
    const handleClose = vi.fn();
    render(<ProfileModal isOpen={true} onClose={handleClose} />);

    // Click Delete Account button to open inner confirmation modal
    const deleteAccountTrigger = screen.getByRole("button", { name: /delete account/i });
    fireEvent.click(deleteAccountTrigger);

    expect(screen.getByText(/are you sure you want to delete your account/i)).toBeInTheDocument();

    // Confirm deletion: the second button with name "Delete Account" inside footer
    const confirmDeleteBtns = screen.getAllByRole("button", { name: /delete account/i });
    const modalConfirmBtn = confirmDeleteBtns[confirmDeleteBtns.length - 1];
    fireEvent.click(modalConfirmBtn!);

    await waitFor(() => {
      expect(deleteAccountAction).toHaveBeenCalled();
      expect(mockLogout).toHaveBeenCalled();
      expect(handleClose).toHaveBeenCalled();
    });
  });

  it("handles cancellation of account deletion and delete error", async () => {
    vi.mocked(deleteAccountAction).mockResolvedValueOnce({
      success: false,
      message: "Cannot delete active admin",
    });

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    // Open confirmation modal
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    expect(screen.getByText(/are you sure you want to delete your account/i)).toBeInTheDocument();

    // Cancel deletion
    const cancelBtn = screen.getByRole("button", { name: "Cancel" });
    fireEvent.click(cancelBtn);
    await waitFor(() => {
      expect(screen.queryByText(/are you sure you want to delete your account/i)).toBeNull();
    });

    // Reopen and trigger error
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const confirmDeleteBtns = screen.getAllByRole("button", { name: /delete account/i });
    fireEvent.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]!);

    await waitFor(() => {
      expect(screen.getByText("Cannot delete active admin")).toBeInTheDocument();
    });
  });

  it("handles GitHub update failure and password change error", async () => {
    vi.mocked(updateGithubUsernameAction).mockResolvedValueOnce({
      success: false,
      message: "GitHub username invalid",
    });
    vi.mocked(changePasswordAction).mockResolvedValueOnce({
      success: false,
      message: "Current password invalid",
    });

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    // GitHub error
    await waitFor(() => {
      expect(screen.getByDisplayValue("testdev")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("GitHub username invalid")).toBeInTheDocument();
    });

    // Password error
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText(/^confirm new password/i), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: /save password/i }));

    await waitFor(() => {
      expect(screen.getByText("Current password invalid")).toBeInTheDocument();
    });
  });

  it("handles non-supporter user and sponsor link click", async () => {
    vi.mocked(getUserProfileAction).mockResolvedValueOnce({
      id: "user-1",
      email: "test@example.com",
      githubUsername: "",
      isSupporter: false,
      isActiveSupporter: false,
      tierName: null,
    } as any);

    const handleClose = vi.fn();
    render(<ProfileModal isOpen={true} onClose={handleClose} />);

    await waitFor(() => {
      expect(
        screen.getByText("Link your account to activate your badge and appear on the wall.")
      ).toBeInTheDocument();
    });

    const sponsorsLink = screen.getByRole("link", { name: /view plans & wall/i });
    expect(sponsorsLink).toHaveAttribute("href", "/sponsors");
    fireEvent.click(sponsorsLink);
    expect(handleClose).toHaveBeenCalled();
  });

  it("handles catch exceptions in GitHub update, password change, and account deletion", async () => {
    vi.mocked(updateGithubUsernameAction).mockRejectedValueOnce(new Error("Network fail"));
    vi.mocked(changePasswordAction).mockRejectedValueOnce(new Error("Password network fail"));
    vi.mocked(deleteAccountAction).mockRejectedValueOnce(new Error("Delete network fail"));

    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);

    // Test GitHub catch error
    await waitFor(() => {
      expect(screen.getByDisplayValue("testdev")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => {
      expect(screen.getByText("Network error while saving.")).toBeInTheDocument();
    });

    // Test password catch error
    fireEvent.click(screen.getByRole("button", { name: /change password/i }));
    fireEvent.change(screen.getByLabelText(/^new password/i), { target: { value: "validpass123" } });
    fireEvent.change(screen.getByLabelText(/^confirm new password/i), { target: { value: "validpass123" } });
    fireEvent.click(screen.getByRole("button", { name: /save password/i }));
    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
    });

    // Test cancel password editing
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText(/^new password/i)).toBeNull();

    // Test delete account catch error
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const confirmDeleteBtns = screen.getAllByRole("button", { name: /delete account/i });
    fireEvent.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]!);
    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred while deleting your account.")).toBeInTheDocument();
    });
  });

  it("handles null profile on modal open", async () => {
    vi.mocked(getUserProfileAction).mockResolvedValueOnce(null as any);
    render(<ProfileModal isOpen={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(getUserProfileAction).toHaveBeenCalled();
    });
  });

  it("handles dialog Escape key close and displays deleting spinner", async () => {
    let resolveDelete: any;
    vi.mocked(deleteAccountAction).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDelete = resolve;
        })
    );

    const handleClose = vi.fn();
    render(<ProfileModal isOpen={true} onClose={handleClose} />);

    // Press Escape on main dialog to trigger onOpenChange -> handleClose
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(handleClose).toHaveBeenCalled();

    // Open delete confirmation modal
    fireEvent.click(screen.getByRole("button", { name: /delete account/i }));
    const confirmDeleteBtns = screen.getAllByRole("button", { name: /delete account/i });
    fireEvent.click(confirmDeleteBtns[confirmDeleteBtns.length - 1]!);

    // Deleting... loading state
    expect(screen.getByText("Deleting...")).toBeInTheDocument();

    // Escape while deleting should NOT close the delete confirmation modal
    const dialogs = screen.getAllByRole("dialog");
    const deleteDialog = dialogs[dialogs.length - 1]!;
    fireEvent.keyDown(deleteDialog, { key: "Escape", code: "Escape" });
    expect(screen.getByText("Deleting...")).toBeInTheDocument();

    await act(async () => {
      resolveDelete({ success: true });
    });
  });
});
