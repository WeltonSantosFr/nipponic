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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { submitFeedbackAction } from "@/actions/feedback";
import type { FeedbackType } from "@nipponic/shared";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
} from "lucide-react";

export interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLogin?: () => void;
}

export function FeedbackModal({ isOpen, onClose, onOpenLogin }: FeedbackModalProps) {
  const { isAuthenticated } = useAuth();

  const [type, setType] = useState<FeedbackType>("BUG");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const resetForm = () => {
    setType("BUG");
    setTitle("");
    setDescription("");
    setErrorMessage(null);
    setIsSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getClientMetadata = () => {
    if (typeof window === "undefined") return undefined;
    const ua = navigator.userAgent;
    const os = ua.includes("Android")
      ? "Android"
      : ua.includes("iPhone") || ua.includes("iPad")
      ? "iOS"
      : ua.includes("Mac")
      ? "macOS"
      : ua.includes("Windows")
      ? "Windows"
      : ua.includes("Linux")
      ? "Linux"
      : "Unknown";

    const browser = ua.includes("Chrome")
      ? "Chrome"
      : ua.includes("Firefox")
      ? "Firefox"
      : ua.includes("Safari")
      ? "Safari"
      : "Browser";

    return {
      os,
      browser,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pathname: window.location.pathname,
      userAgent: ua,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim().length < 3) {
      setErrorMessage("Title must be at least 3 characters long.");
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setErrorMessage("Description must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const metadata = getClientMetadata();
      const res = await submitFeedbackAction({
        type,
        title: title.trim(),
        description: description.trim(),
        clientMetadata: metadata,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to submit ticket. Please try again.");
      } else {
        setIsSuccess(true);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="w-full max-w-[95vw] sm:max-w-lg p-4 sm:p-6 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl">
        {!isAuthenticated ? (
          <div className="flex flex-col items-center text-center p-3 sm:p-5 gap-3 sm:gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <ShieldAlert size={26} />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight">
                Authentication Required
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                Please sign in to your Nipponic account to report bugs or submit feature suggestions so we can follow up with you.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 w-full mt-2">
              <Button
                variant="outline"
                className="w-full sm:w-auto justify-center"
                onClick={handleClose}
              >
                Close
              </Button>
              {onOpenLogin && (
                <Button
                  className="w-full sm:w-auto justify-center"
                  onClick={() => {
                    handleClose();
                    onOpenLogin();
                  }}
                >
                  Sign In
                </Button>
              )}
            </DialogFooter>
          </div>
        ) : isSuccess ? (
          <div className="flex flex-col items-center text-center p-3 sm:p-5 gap-3 sm:gap-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-inner">
              <CheckCircle2 size={32} />
            </div>
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Thank you for your feedback!
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground max-w-sm">
                Your ticket has been recorded. Our team reviews every suggestion and bug report to keep improving Nipponic.
              </DialogDescription>
            </DialogHeader>

            <Button
              className="w-full sm:w-auto mt-2 px-6 justify-center"
              onClick={handleClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 min-w-0">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                Feedback & Bug Report
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                Encountered an issue or have an idea to make studying better? Let us know.
              </DialogDescription>
            </DialogHeader>

            {errorMessage && (
              <div
                role="alert"
                className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs sm:text-sm break-words min-w-0"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0">{errorMessage}</span>
              </div>
            )}

            {/* Type selector */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Category
              </Label>
              <div className="grid grid-cols-3 gap-2 w-full min-w-0">
                <button
                  type="button"
                  onClick={() => setType("BUG")}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all min-w-0 ${
                    type === "BUG"
                      ? "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400 font-semibold shadow-xs"
                      : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Bug size={18} className="mb-1 shrink-0" />
                  <span className="truncate w-full text-center">Bug</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("SUGGESTION")}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all min-w-0 ${
                    type === "SUGGESTION"
                      ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold shadow-xs"
                      : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <Lightbulb size={18} className="mb-1 shrink-0" />
                  <span className="truncate w-full text-center">Idea</span>
                </button>

                <button
                  type="button"
                  onClick={() => setType("FEEDBACK")}
                  className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all min-w-0 ${
                    type === "FEEDBACK"
                      ? "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold shadow-xs"
                      : "border-border bg-card hover:bg-muted/50 text-muted-foreground"
                  }`}
                >
                  <MessageSquare size={18} className="mb-1 shrink-0" />
                  <span className="truncate w-full text-center">Feedback</span>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex justify-between items-center text-xs">
                <Label htmlFor="ticket-title" className="font-semibold text-muted-foreground uppercase tracking-wider">
                  Title
                </Label>
                <span className="text-[11px] text-muted-foreground">{title.length}/120</span>
              </div>
              <Input
                id="ticket-title"
                maxLength={120}
                placeholder={
                  type === "BUG"
                    ? "e.g. Flashcard audio does not play on mobile"
                    : type === "SUGGESTION"
                    ? "e.g. Add custom tags for vocabulary cards"
                    : "e.g. General impressions on the grammar lessons"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-w-0 text-sm rounded-xl"
                disabled={isSubmitting}
                required
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex justify-between items-center text-xs">
                <Label htmlFor="ticket-description" className="font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </Label>
                <span className="text-[11px] text-muted-foreground">{description.length}/3000</span>
              </div>
              <Textarea
                id="ticket-description"
                maxLength={3000}
                rows={4}
                placeholder={
                  type === "BUG"
                    ? "Please describe what happened, steps to reproduce, and what you expected to see..."
                    : "Share details about your idea and how it would improve your study routine..."
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-w-0 text-sm resize-none rounded-xl"
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
              💡 System diagnostics (browser family, viewport size, and OS) are automatically attached to help diagnose issues.
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 w-full mt-1">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto justify-center rounded-xl"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto justify-center rounded-xl gap-2 font-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Send Ticket"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
