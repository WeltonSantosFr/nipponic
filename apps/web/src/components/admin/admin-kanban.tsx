"use client";

import { useState, useTransition, useMemo } from "react";
import {
  type FeedbackTicket,
  type FeedbackStatus,
  type FeedbackType,
} from "@nipponic/shared";
import {
  updateAdminTicketAction,
  deleteAdminTicketAction,
} from "@/actions/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bug,
  Lightbulb,
  MessageSquare,
  Search,
  Trash2,
  Save,
  User,
  Monitor,
  CheckCircle2,
  XCircle,
  PlayCircle,
  Inbox,
  Filter,
  Loader2,
  RefreshCw,
} from "lucide-react";

const COLUMNS: {
  id: FeedbackStatus;
  label: string;
  icon: typeof Inbox;
  badgeClass: string;
  columnClass: string;
}[] = [
  {
    id: "OPEN",
    label: "Open",
    icon: Inbox,
    badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
    columnClass: "border-amber-500/20 bg-amber-500/5",
  },
  {
    id: "IN_PROGRESS",
    label: "In Progress",
    icon: PlayCircle,
    badgeClass: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
    columnClass: "border-blue-500/20 bg-blue-500/5",
  },
  {
    id: "RESOLVED",
    label: "Resolved",
    icon: CheckCircle2,
    badgeClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    columnClass: "border-emerald-500/20 bg-emerald-500/5",
  },
  {
    id: "CLOSED",
    label: "Closed",
    icon: XCircle,
    badgeClass: "bg-zinc-500/15 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
    columnClass: "border-zinc-500/20 bg-zinc-500/5",
  },
];

interface AdminKanbanProps {
  initialTickets: FeedbackTicket[];
  onRefresh?: () => Promise<void>;
}

export function AdminKanban({ initialTickets, onRefresh }: AdminKanbanProps) {
  const [tickets, setTickets] = useState<FeedbackTicket[]>(initialTickets);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "ALL">("ALL");
  const [activeMobileColumn, setActiveMobileColumn] = useState<FeedbackStatus>("OPEN");
  const [isPending, startTransition] = useTransition();

  // Selected ticket for modal detail view
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [editingNotes, setEditingNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Drag-and-drop state
  const [draggedTicketId, setDraggedTicketId] = useState<string | null>(null);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (typeFilter !== "ALL" && ticket.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = ticket.title.toLowerCase().includes(query);
        const matchesDesc = ticket.description.toLowerCase().includes(query);
        const matchesUser =
          ticket.user?.username.toLowerCase().includes(query) ||
          ticket.user?.email.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesUser) return false;
      }
      return true;
    });
  }, [tickets, typeFilter, searchQuery]);

  const handleStatusChange = async (ticketId: string, newStatus: FeedbackStatus) => {
    // Optimistic update
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)),
    );
    if (selectedTicket && selectedTicket.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : null));
    }

    try {
      const res = await updateAdminTicketAction(ticketId, { status: newStatus });
      if (!res.success) {
        // Rollback on failure
        setTickets(initialTickets);
      }
    } catch {
      setTickets(initialTickets);
    }
  };

  const handleOpenDetail = (ticket: FeedbackTicket) => {
    setSelectedTicket(ticket);
    setEditingNotes(ticket.adminNotes || "");
  };

  const handleSaveNotes = async () => {
    if (!selectedTicket) return;
    setIsSavingNotes(true);
    try {
      const res = await updateAdminTicketAction(selectedTicket.id, {
        adminNotes: editingNotes.trim() || null,
      });
      if (res.success && res.ticket) {
        setTickets((prev) =>
          prev.map((t) => (t.id === selectedTicket.id ? res.ticket! : t)),
        );
        setSelectedTicket(res.ticket);
      }
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleDeleteTicket = async () => {
    if (!selectedTicket) return;
    setIsDeleting(true);
    try {
      const res = await deleteAdminTicketAction(selectedTicket.id);
      if (res.success) {
        setTickets((prev) => prev.filter((t) => t.id !== selectedTicket.id));
        setDeleteConfirmOpen(false);
        setSelectedTicket(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Drag and drop handlers
  const onDragStart = (e: React.DragEvent, ticketId: string) => {
    e.dataTransfer.setData("text/plain", ticketId);
    setDraggedTicketId(ticketId);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, targetStatus: FeedbackStatus) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData("text/plain") || draggedTicketId;
    if (ticketId) {
      handleStatusChange(ticketId, targetStatus);
    }
    setDraggedTicketId(null);
  };

  const renderTypeBadge = (type: FeedbackType) => {
    switch (type) {
      case "BUG":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 gap-1 text-[11px] font-medium py-0.5">
            <Bug size={12} />
            Bug
          </Badge>
        );
      case "SUGGESTION":
        return (
          <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 gap-1 text-[11px] font-medium py-0.5">
            <Lightbulb size={12} />
            Idea
          </Badge>
        );
      case "FEEDBACK":
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px] font-medium py-0.5">
            <MessageSquare size={12} />
            Feedback
          </Badge>
        );
    }
  };

  const formatDate = (dateStr: string | Date) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 max-w-full">
      {/* Controls Bar: Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between w-full min-w-0 bg-card p-3.5 sm:p-4 rounded-2xl border border-border/80 shadow-xs">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tickets by title, text, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 w-full min-w-0 rounded-xl text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs text-muted-foreground hidden lg:inline-flex items-center gap-1">
            <Filter size={13} />
            Type:
          </span>
          {(["ALL", "BUG", "SUGGESTION", "FEEDBACK"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "bg-muted/50 hover:bg-muted text-muted-foreground"
              }`}
            >
              {t === "ALL" ? "All" : t === "BUG" ? "Bugs" : t === "SUGGESTION" ? "Ideas" : "Feedback"}
            </button>
          ))}

          {onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => startTransition(onRefresh)}
              disabled={isPending}
              className="rounded-xl h-9 ml-auto sm:ml-0"
              title="Refresh tickets"
            >
              <RefreshCw size={14} className={isPending ? "animate-spin" : ""} />
            </Button>
          )}
        </div>
      </div>

      {/* Mobile Column Tabs (Visible on screens < 768px) */}
      <div className="flex md:hidden gap-1.5 p-1 bg-muted/40 rounded-xl overflow-x-auto min-w-0 max-w-full border border-border/50">
        {COLUMNS.map((col) => {
          const count = filteredTickets.filter((t) => t.status === col.id).length;
          const isActive = activeMobileColumn === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileColumn(col.id)}
              className={`flex-1 min-w-[70px] py-2 px-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? "bg-card text-foreground shadow-xs font-semibold border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate">{col.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${col.badgeClass}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full min-w-0 max-w-full">
        {COLUMNS.map((column) => {
          const colTickets = filteredTickets.filter((t) => t.status === column.id);
          const Icon = column.icon;

          // On mobile screens (< 768px), only show the active tab
          const isHiddenOnMobile = activeMobileColumn !== column.id;

          return (
            <div
              key={column.id}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, column.id)}
              className={`flex flex-col rounded-2xl border ${column.columnClass} bg-card/60 backdrop-blur-xs min-w-0 overflow-hidden transition-all ${
                isHiddenOnMobile ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-border/60 bg-card/80">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon size={16} className="text-muted-foreground shrink-0" />
                  <span className="font-semibold text-sm text-foreground truncate">
                    {column.label}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${column.badgeClass}`}>
                  {colTickets.length}
                </span>
              </div>

              {/* Column Body / Cards List */}
              <div className="flex flex-col gap-2.5 p-3 min-h-[350px] max-h-[calc(100vh-280px)] overflow-y-auto">
                {colTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-xs">
                    <p className="font-medium">No tickets</p>
                    <p className="text-[11px] opacity-70">Drag cards here</p>
                  </div>
                ) : (
                  colTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, ticket.id)}
                      onClick={() => handleOpenDetail(ticket)}
                      className="group flex flex-col gap-2 p-3.5 rounded-xl bg-card border border-border/80 hover:border-primary/50 shadow-xs hover:shadow-sm cursor-pointer transition-all active:scale-[0.99] min-w-0"
                    >
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        {renderTypeBadge(ticket.type)}
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {formatDate(ticket.createdAt)}
                        </span>
                      </div>

                      <h4 className="font-semibold text-sm text-foreground leading-snug line-clamp-2 break-words min-w-0">
                        {ticket.title}
                      </h4>

                      <p className="text-xs text-muted-foreground line-clamp-2 break-words min-w-0">
                        {ticket.description}
                      </p>

                      {/* Author & Device footer */}
                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-border/40 text-[11px] text-muted-foreground min-w-0">
                        <div className="flex items-center gap-1 truncate min-w-0">
                          <User size={12} className="shrink-0" />
                          <span className="truncate">{ticket.user?.username || "Anonymous"}</span>
                        </div>

                        {ticket.adminNotes && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                            Has notes
                          </span>
                        )}
                      </div>

                      {/* Quick Move Selector (Especially helpful on mobile) */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex md:hidden items-center justify-end gap-1 pt-1 text-[11px]"
                      >
                        <span className="text-[10px] text-muted-foreground mr-1">Move:</span>
                        {COLUMNS.filter((c) => c.id !== ticket.status).map((c) => (
                          <button
                            key={c.id}
                            onClick={() => handleStatusChange(ticket.id, c.id)}
                            className="px-2 py-0.5 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground text-[10px] transition-colors"
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-2xl p-4 sm:p-6 overflow-hidden rounded-2xl bg-card border border-border shadow-2xl max-h-[90vh] flex flex-col">
            <DialogHeader className="space-y-2 text-left shrink-0">
              <div className="flex flex-wrap items-center gap-2">
                {renderTypeBadge(selectedTicket.type)}
                <span className="text-xs text-muted-foreground">
                  Submitted {formatDate(selectedTicket.createdAt)}
                </span>
              </div>
              <DialogTitle className="text-lg sm:text-xl font-bold tracking-tight text-foreground break-words min-w-0">
                {selectedTicket.title}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-w-0 py-2">
              {/* Status Selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-muted/40 border border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Ticket Status
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {COLUMNS.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => handleStatusChange(selectedTicket.id, col.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                        selectedTicket.status === col.id
                          ? `${col.badgeClass} font-bold shadow-xs border`
                          : "bg-card text-muted-foreground hover:bg-muted border border-border/60"
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Description
                </span>
                <div className="p-3.5 rounded-xl bg-card border border-border/80 text-sm whitespace-pre-wrap break-words min-w-0">
                  {selectedTicket.description}
                </div>
              </div>

              {/* User & Client Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <User size={13} />
                    <span>Submitted By</span>
                  </div>
                  <p className="truncate text-muted-foreground">
                    <strong className="text-foreground">Username:</strong> {selectedTicket.user?.username || "N/A"}
                  </p>
                  <p className="truncate text-muted-foreground">
                    <strong className="text-foreground">Email:</strong> {selectedTicket.user?.email || "N/A"}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 text-xs space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <Monitor size={13} />
                    <span>Device Diagnostics</span>
                  </div>
                  <p className="truncate text-muted-foreground">
                    <strong className="text-foreground">OS:</strong> {selectedTicket.clientMetadata?.os || "N/A"}
                  </p>
                  <p className="truncate text-muted-foreground">
                    <strong className="text-foreground">Browser:</strong> {selectedTicket.clientMetadata?.browser || "N/A"}
                  </p>
                  <p className="truncate text-muted-foreground">
                    <strong className="text-foreground">Viewport:</strong> {selectedTicket.clientMetadata?.viewport || "N/A"}
                  </p>
                  <p className="truncate text-muted-foreground">
                    <strong className="text-foreground">Page:</strong> {selectedTicket.clientMetadata?.pathname || "/"}
                  </p>
                </div>
              </div>

              {/* Admin Notes Section */}
              <div className="space-y-2 min-w-0 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Internal Admin Notes
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="h-7 text-xs rounded-lg gap-1"
                  >
                    {isSavingNotes ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save Notes
                  </Button>
                </div>
                <Textarea
                  placeholder="Add private internal notes (e.g. cause of bug, planned fix, PR link)..."
                  rows={3}
                  value={editingNotes}
                  onChange={(e) => setEditingNotes(e.target.value)}
                  className="w-full min-w-0 text-xs sm:text-sm rounded-xl resize-none"
                />
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row justify-between gap-2 sm:gap-3 w-full shrink-0 pt-3 border-t border-border/60">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirmOpen(true)}
                className="w-full sm:w-auto rounded-xl gap-1.5"
              >
                <Trash2 size={14} />
                Delete Ticket
              </Button>

              <Button
                variant="outline"
                onClick={() => setSelectedTicket(null)}
                className="w-full sm:w-auto rounded-xl"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Alert Dialog */}
      {deleteConfirmOpen && (
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="w-full max-w-[95vw] sm:max-w-md p-4 sm:p-6 rounded-2xl bg-card border border-border shadow-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base sm:text-lg font-bold">
                Permanently Delete Ticket?
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
                This action cannot be undone. This feedback ticket will be permanently removed from the database.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 w-full mt-3">
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto gap-1.5"
                onClick={handleDeleteTicket}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                Confirm Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
