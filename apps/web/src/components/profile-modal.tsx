"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { changePasswordAction, deleteAccountAction } from "@/actions/user";
import {
  UserRound,
  Mail,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, logout } = useAuth();

  // Password change state
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Delete account confirmation modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const resetPasswordState = () => {
    setIsChangingPassword(false);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
  };

  const handleClose = () => {
    resetPasswordState();
    setPasswordSuccess(null);
    setIsDeleteModalOpen(false);
    onClose();
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordLoading(true);
    try {
      const result = await changePasswordAction(newPassword);
      if (result.success) {
        setPasswordSuccess("Password updated successfully!");
        resetPasswordState();
      } else {
        setPasswordError(result.message || "Failed to update password.");
      }
    } catch {
      setPasswordError("An unexpected error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const result = await deleteAccountAction();
      if (result.success) {
        await logout();
        setIsDeleteModalOpen(false);
        onClose();
      } else {
        setDeleteError(result.message || "Failed to delete account.");
      }
    } catch {
      setDeleteError("An unexpected error occurred while deleting your account.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Main Profile Modal */}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Account Profile</DialogTitle>
                <DialogDescription>
                  Manage your personal information and account settings.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* User Details */}
            <div className="space-y-3 rounded-lg border border-border/70 bg-muted/30 p-3.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <UserRound size={15} />
                  Username
                </span>
                <span className="font-semibold text-foreground">
                  {user.username}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={15} />
                  Email
                </span>
                <span className="font-medium text-foreground">
                  {user.email}
                </span>
              </div>
            </div>

            {/* Password Success Feedback */}
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-500/10 p-3 text-xs text-green-600 dark:text-green-400">
                <CheckCircle2 size={15} />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Change Password Section */}
            {!isChangingPassword ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordSuccess(null);
                  setIsChangingPassword(true);
                }}
                className="w-full justify-start gap-2"
              >
                <KeyRound size={16} />
                Change Password
              </Button>
            ) : (
              <form
                onSubmit={handlePasswordSubmit}
                className="space-y-3 rounded-lg border border-border/80 bg-muted/40 p-3.5"
              >
                <div className="flex items-center gap-2 font-medium text-sm">
                  <KeyRound size={15} className="text-primary" />
                  <span>Update Password</span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-password" className="text-xs">
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                    className="h-8 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password" className="text-xs">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={passwordLoading}
                    className="h-8 text-xs"
                  />
                </div>

                {passwordError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-500">
                    <AlertCircle size={14} />
                    <span>{passwordError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={passwordLoading}
                    onClick={resetPasswordState}
                    className="h-8 px-3 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={passwordLoading}
                    className="h-8 px-3 text-xs gap-1.5"
                  >
                    {passwordLoading && (
                      <Loader2 size={13} className="animate-spin" />
                    )}
                    Save Password
                  </Button>
                </div>
              </form>
            )}

            <Separator />

            {/* Danger Zone: Delete Account Button */}
            <div className="space-y-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full gap-2 bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 size={16} />
                Delete Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account Confirmation Modal */}
      <Dialog
        open={isDeleteModalOpen}
        onOpenChange={(open) => !open && !isDeletingAccount && setIsDeleteModalOpen(false)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5 text-red-500" />
              <DialogTitle>Delete Account</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Are you sure you want to delete your account{" "}
              <span className="font-semibold text-foreground">
                "{user.username}"
              </span>
              ? All your saved notes and personal data will be permanently removed.
              <span className="block mt-1 font-medium text-destructive">
                This action cannot be undone.
              </span>
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="flex items-center gap-1.5 text-xs text-red-500 bg-red-500/10 p-2.5 rounded-md">
              <AlertCircle size={14} />
              <span>{deleteError}</span>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              disabled={isDeletingAccount}
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
              disabled={isDeletingAccount}
              onClick={handleDeleteAccountConfirm}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Delete Account
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
