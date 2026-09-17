"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { validateSessionAction } from "@/actions/auth";
import { API_URL } from "@/lib/api-config";
import { Button } from "@/components/ui/button";
import { Loader2, Server, AlertTriangle, RefreshCw } from "lucide-react";

const MAX_WAIT_SECONDS = 75;
const PING_INTERVAL_MS = 4000;

export function ServerWakeupOverlay() {
  const {
    isWakingServer,
    setIsWakingServer,
    hasInitialToken,
    logout,
    setUser,
    isAuthenticated,
    user,
  } = useAuth();


  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const isCheckingRef = useRef(false);

  // Ping the API until it responds with a successful status
  const performPing = useCallback(async (): Promise<boolean> => {
    try {
      const pingUrl = `${API_URL.replace(/\/+$/, "")}/`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(pingUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);

      // Status < 500 means server container is alive and responding
      return res.ok || res.status < 500;
    } catch {
      return false;
    }
  }, []);

  const wakeUpAndValidate = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;
    setIsTimedOut(false);

    const startTime = Date.now();
    let isServerAwake = false;

    // Loop until server is awake or max wait is exceeded
    while (Date.now() - startTime < MAX_WAIT_SECONDS * 1000) {
      const awake = await performPing();
      if (awake) {
        isServerAwake = true;
        break;
      }
      // Wait for PING_INTERVAL_MS before trying again
      await new Promise((resolve) => setTimeout(resolve, PING_INTERVAL_MS));
    }

    if (!isServerAwake) {
      setIsTimedOut(true);
      isCheckingRef.current = false;
      return;
    }

    // Server is awake! Now validate token / session
    try {
      const result = await validateSessionAction();

      if (result.status === "valid" && result.user) {
        setUser(result.user);
      } else if (result.status === "invalid") {
        await logout();
      }
    } catch (err) {
      console.error("Session validation error:", err);
    } finally {
      setIsWakingServer(false);
      isCheckingRef.current = false;
    }
  }, [performPing, logout, setUser, setIsWakingServer]);

  // Run on mount or retry
  useEffect(() => {
    if (!isWakingServer || !hasInitialToken) return;

    setElapsedSeconds(0);
    setIsTimedOut(false);
    wakeUpAndValidate();
  }, [isWakingServer, hasInitialToken, retryCount, wakeUpAndValidate]);

  // Elapsed seconds timer
  useEffect(() => {
    if (!isWakingServer || isTimedOut) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isWakingServer, isTimedOut]);

  // If user is not waking or didn't have an initial token, do not render overlay
  if (!isWakingServer || !hasInitialToken) {
    return null;
  }

  const handleRetry = () => {
    isCheckingRef.current = false;
    setIsTimedOut(false);
    setElapsedSeconds(0);
    setRetryCount((prev) => prev + 1);
  };

  const handleContinueAsGuest = async () => {
    if (isAuthenticated || user) {
      await logout();
    }
    setIsWakingServer(false);
  };


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="server-wakeup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md transition-all duration-300 animate-in fade-in"
    >
      <div className="max-w-md w-full p-6 sm:p-8 bg-card border border-border shadow-2xl rounded-2xl flex flex-col items-center text-center space-y-5">
        {!isTimedOut ? (
          <>
            {/* Animated Server / Loader Icon */}
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary">
              <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-30" />
              <Server className="w-8 h-8 relative z-10" />
            </div>

            <div className="space-y-2">
              <h2
                id="server-wakeup-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
              >
                Connecting to server...
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                We are waking up our free cloud server. Because it spins down
                after periods of inactivity, the initial connection may take up
                to 1 minute. Your notes and flashcards are safe!
              </p>
            </div>

            {/* Timer Badge and Spinner */}
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-muted/60 border border-border/60 text-xs font-mono text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />
              <span>
                Waiting for server ({elapsedSeconds}s)
              </span>
            </div>

            {/* Subtle progress animation */}
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-[indeterminate_1.5s_infinite_linear] rounded-full" />
            </div>
          </>
        ) : (
          <>
            {/* Timeout / Error State */}
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2
                id="server-wakeup-title"
                className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
              >
                Server is taking longer to respond
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Starting up the server took longer than {MAX_WAIT_SECONDS}{" "}
                seconds. You can try again or continue to use the app.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full pt-2">
              <Button
                variant="default"
                className="flex-1"
                onClick={handleRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleContinueAsGuest}
              >
                Continue anyway
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
