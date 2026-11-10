"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { getAdminTicketsAction } from "@/actions/feedback";
import { AdminKanban } from "@/components/admin/admin-kanban";
import type { FeedbackTicket } from "@nipponic/shared";
import {
  ArrowLeft,
  ShieldAlert,
  Loader2,
  Lock,
  Layers,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [tickets, setTickets] = useState<FeedbackTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const isAdmin = isAuthenticated && user?.role === "ADMIN";

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAdminTicketsAction();
      if (res.success) {
        setTickets(res.tickets);
      } else {
        setError(res.error || "Failed to load tickets.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tickets.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (isAdmin) {
        loadTickets();
      } else {
        setIsLoading(false);
      }
    }
  }, [isMounted, isAdmin, loadTickets]);

  if (!isMounted) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-background text-foreground">
        <Loader2 size={32} className="animate-spin text-primary" />
      </main>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-background text-foreground min-w-0 max-w-full">
        <div className="w-full max-w-md p-6 sm:p-8 rounded-2xl bg-card border border-border shadow-xl text-center space-y-4 min-w-0">
          <div className="w-14 h-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto shadow-inner">
            <Lock size={28} />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Access Restricted
          </h1>
          <p className="text-sm text-muted-foreground">
            You must be signed in with an authorized Administrator account to view the feedback dashboard.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto rounded-xl")}
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Workspace
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-background/50 p-3 sm:p-6 md:p-8 pb-safe pt-safe min-w-0 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto space-y-6 min-w-0">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-border/80 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              title="Return to main app"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl shrink-0 gap-1.5",
              )}
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Workspace</span>
            </Link>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-foreground truncate">
                  Admin Feedback Dashboard
                </h1>
                <Badge
                  variant="outline"
                  className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-semibold py-0.5"
                >
                  <ShieldAlert size={12} />
                  Admin
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                Track user feedback, bug reports, and suggestions in real time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-xl border border-border/60">
            <Layers size={14} className="text-primary shrink-0" />
            <span>
              Total Tickets: <strong className="text-foreground">{tickets.length}</strong>
            </span>
          </div>
        </header>

        {/* Loading / Error / Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 size={32} className="animate-spin text-primary" />
            <p className="text-sm">Loading tickets...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex flex-col items-center gap-3 text-center">
            <p>{error}</p>
            <Button size="sm" variant="outline" onClick={loadTickets}>
              Try Again
            </Button>
          </div>
        ) : (
          <AdminKanban initialTickets={tickets} onRefresh={loadTickets} />
        )}
      </div>
    </main>
  );
}
