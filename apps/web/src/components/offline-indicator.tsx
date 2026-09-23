"use client";

import { useEffect, useState } from "react";
import {
  subscribeOfflineSync,
  syncPendingReviews,
  OfflineSyncState,
  getOfflineSyncState,
} from "@/services/offline-sync";
import { WifiOff, RefreshCw, CheckCircle2 } from "lucide-react";

export function OfflineIndicator({ className = "" }: { className?: string }) {
  const [syncState, setSyncState] = useState<OfflineSyncState>(getOfflineSyncState);
  const [showSyncedSuccess, setShowSyncedSuccess] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    const unsubscribe = subscribeOfflineSync((state) => {
      setSyncState((prevState) => {
        // If we transitioned from syncing to not syncing, and pendingCount dropped to 0 with lastSyncedAt
        if (prevState.isSyncing && !state.isSyncing && state.pendingCount === 0 && state.lastSyncedAt) {
          setShowSyncedSuccess(true);
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setShowSyncedSuccess(false);
          }, 3500);
        }
        return state;
      });
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleManualSync = () => {
    if (syncState.isOnline && !syncState.isSyncing && syncState.pendingCount > 0) {
      syncPendingReviews().catch(() => {});
    }
  };

  // If online, not syncing, and nothing pending or recently synced, keep UI clean
  if (syncState.isOnline && !syncState.isSyncing && syncState.pendingCount === 0 && !showSyncedSuccess) {
    return null;
  }

  return (
    <aside
      aria-label="Offline status and sync indicators"
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-200 select-none ${className}`}
    >
      {!syncState.isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-xs"
        >
          <WifiOff className="h-3 w-3 shrink-0 animate-pulse" />
          <span>Offline</span>
          {syncState.pendingCount > 0 && (
            <span className="opacity-90">
              • {syncState.pendingCount} pending sync
            </span>
          )}
        </div>
      )}

      {syncState.isOnline && syncState.isSyncing && (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs"
        >
          <RefreshCw className="h-3 w-3 shrink-0 animate-spin" />
          <span>Syncing reviews ({syncState.pendingCount})...</span>
        </div>
      )}

      {syncState.isOnline && !syncState.isSyncing && syncState.pendingCount > 0 && (
        <button
          type="button"
          onClick={handleManualSync}
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer shadow-xs"
          title="Click to sync now"
        >
          <RefreshCw className="h-3 w-3 shrink-0" />
          <span>{syncState.pendingCount} review{syncState.pendingCount > 1 ? "s" : ""} pending • Sync now</span>
        </button>
      )}

      {syncState.isOnline && !syncState.isSyncing && showSyncedSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-xs animate-in fade-in duration-200"
        >
          <CheckCircle2 className="h-3 w-3 shrink-0" />
          <span>Synced!</span>
        </div>
      )}
    </aside>
  );
}
