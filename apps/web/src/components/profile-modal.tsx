"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { changePasswordAction, deleteAccountAction, getUserProfileAction, updateGithubUsernameAction } from "@/actions/user";
import { SupporterBadge } from "@/components/supporter-badge";
import {
  UserRound,
  Mail,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Heart,
  ExternalLink,
} from "lucide-react";
import type { ProfileModalProps } from "@nipponic/shared";

function GithubIcon({ size = 15, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export type { ProfileModalProps };

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

  // GitHub & Supporter state
  const [githubUsername, setGithubUsername] = useState("");
  const [isSupporter, setIsSupporter] = useState(false);
  const [isActiveSupporter, setIsActiveSupporter] = useState(false);
  const [tierName, setTierName] = useState<string | null>(null);
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubSuccess, setGithubSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      getUserProfileAction().then((profile) => {
        if (profile) {
          setGithubUsername(profile.githubUsername || "");
          setIsSupporter(!!profile.isSupporter);
          setIsActiveSupporter(!!profile.isActiveSupporter);
          setTierName(profile.tierName || null);
        }
      });
    }
  }, [isOpen]);

  const handleGithubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGithubError(null);
    setGithubSuccess(null);
    setGithubLoading(true);

    try {
      const res = await updateGithubUsernameAction(githubUsername);
      if (res.success) {
        setGithubSuccess("GitHub account linked successfully!");
        if (res.user) {
          setIsSupporter(!!res.user.isSupporter);
          setIsActiveSupporter(!!res.user.isActiveSupporter);
          setTierName(res.user.tierName || null);
        }
      } else {
        setGithubError(res.message || "Failed to link GitHub account.");
      }
    } catch {
      setGithubError("Network error while saving.");
    } finally {
      setGithubLoading(false);
    }
  };

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
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle>Account Profile</DialogTitle>
                  <SupporterBadge
                    isSupporter={isSupporter}
                    isActiveSupporter={isActiveSupporter}
                    tierName={tierName}
                    size="sm"
                  />
                </div>
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

            {/* GitHub & Project Sponsorship */}
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/20 p-3.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <GithubIcon size={15} />
                  GitHub Link (Sponsors)
                </span>
                {isSupporter && (
                  <SupporterBadge
                    isSupporter={isSupporter}
                    isActiveSupporter={isActiveSupporter}
                    tierName={tierName}
                    size="sm"
                  />
                )}
              </div>

              <form onSubmit={handleGithubSubmit} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground font-mono">
                      @
                    </span>
                    <Input
                      id="github-username"
                      placeholder="your-github-username"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.target.value)}
                      className="h-8 pl-6 text-xs"
                      disabled={githubLoading}
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={githubLoading}
                    className="h-8 px-3 text-xs"
                  >
                    {githubLoading ? <Loader2 size={12} className="animate-spin" /> : "Save"}
                  </Button>
                </div>

                {githubSuccess && (
                  <div className="flex items-center gap-1.5 text-[11px] text-green-600 dark:text-green-400">
                    <CheckCircle2 size={13} />
                    <span>{githubSuccess}</span>
                  </div>
                )}

                {githubError && (
                  <div className="flex items-center gap-1.5 text-[11px] text-red-500">
                    <AlertCircle size={13} />
                    <span>{githubError}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-muted-foreground flex-wrap gap-1">
                  <span>
                    {isSupporter
                      ? "Your sponsorship is active in Nipponic! 💖"
                      : "Link your account to activate your badge and appear on the wall."}
                  </span>
                  <Link
                    href="/sponsors"
                    onClick={() => onClose()}
                    className="inline-flex items-center gap-1 text-primary hover:underline font-medium shrink-0 ml-auto"
                  >
                    View Plans & Wall <ExternalLink size={11} />
                  </Link>
                </div>
              </form>
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
