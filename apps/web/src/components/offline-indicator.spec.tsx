import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { OfflineIndicator } from "./offline-indicator";
import * as offlineSync from "@/services/offline-sync";

vi.mock("@/services/offline-sync", () => {
  let mockState: offlineSync.OfflineSyncState = {
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedAt: null,
  };
  const listeners = new Set<(s: offlineSync.OfflineSyncState) => void>();

  return {
    getOfflineSyncState: () => mockState,
    subscribeOfflineSync: (fn: (s: offlineSync.OfflineSyncState) => void) => {
      listeners.add(fn);
      fn(mockState);
      return () => listeners.delete(fn);
    },
    syncPendingReviews: vi.fn().mockResolvedValue({ syncedCount: 0, remainingCount: 0 }),
    __setMockState: (newState: Partial<offlineSync.OfflineSyncState>) => {
      mockState = { ...mockState, ...newState };
      listeners.forEach((l) => l(mockState));
    },
  };
});

interface MockOfflineSyncModule {
  __setMockState: (newState: Partial<offlineSync.OfflineSyncState>) => void;
}

const mockOfflineSync = offlineSync as unknown as MockOfflineSyncModule;

describe("OfflineIndicator", () => {
  beforeEach(() => {
    mockOfflineSync.__setMockState({
      isOnline: true,
      isSyncing: false,
      pendingCount: 0,
      lastSyncedAt: null,
    });
    vi.clearAllMocks();
  });

  it("should render nothing when online and idle with zero pending reviews", () => {
    const { container } = render(<OfflineIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it("should render offline badge when offline", () => {
    render(<OfflineIndicator />);
    act(() => {
      mockOfflineSync.__setMockState({ isOnline: false, pendingCount: 0 });
    });

    expect(screen.getByText("Offline")).toBeInTheDocument();
  });

  it("should show pending review count when offline with queued items", () => {
    render(<OfflineIndicator />);
    act(() => {
      mockOfflineSync.__setMockState({ isOnline: false, pendingCount: 3 });
    });

    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.getByText(/• 3 pending sync/)).toBeInTheDocument();
  });

  it("should render syncing indicator when syncing is in progress", () => {
    render(<OfflineIndicator />);
    act(() => {
      mockOfflineSync.__setMockState({
        isOnline: true,
        isSyncing: true,
        pendingCount: 2,
      });
    });

    expect(screen.getByText(/Syncing reviews \(2\)\.\.\./)).toBeInTheDocument();
  });

  it("should allow manual sync click when online and has pending reviews", () => {
    render(<OfflineIndicator />);
    act(() => {
      mockOfflineSync.__setMockState({
        isOnline: true,
        isSyncing: false,
        pendingCount: 2,
      });
    });

    const button = screen.getByTitle("Click to sync now");
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(offlineSync.syncPendingReviews).toHaveBeenCalled();
  });

  it("should show Synced! badge after syncing completes", () => {
    render(<OfflineIndicator />);
    act(() => {
      mockOfflineSync.__setMockState({
        isOnline: true,
        isSyncing: true,
        pendingCount: 2,
      });
    });

    act(() => {
      mockOfflineSync.__setMockState({
        isOnline: true,
        isSyncing: false,
        pendingCount: 0,
        lastSyncedAt: new Date(),
      });
    });

    expect(screen.getByText("Synced!")).toBeInTheDocument();
  });
});
