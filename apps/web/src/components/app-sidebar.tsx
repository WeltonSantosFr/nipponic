import { DeleteNoteModal } from "@/components/delete-note-modal";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/contexts/NotesContext";
import { Note } from "@nipponic/shared";
import {
  BookOpen,
  DoorOpen,
  Plus,
  Search,
  Settings,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useState } from "react";

interface AppSidebarProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
}

export function AppSidebar({
  selectedNoteId,
  onSelectNote,
}: AppSidebarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { notes, createNewNote, deleteNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = startOfToday - 7 * ONE_DAY_MS;
  const thirtyDaysAgo = startOfToday - 30 * ONE_DAY_MS;

  const parseDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? now.getTime() : d.getTime();
  };

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const titleMatch = (note.title || "").toLowerCase().includes(q);
    const contentMatch = (note.enText || "").toLowerCase().includes(q);
    return titleMatch || contentMatch;
  });

  const todayNotes: Note[] = [];
  const weekNotes: Note[] = [];
  const monthNotes: Note[] = [];
  const olderNotes: Note[] = [];

  filteredNotes.forEach((note) => {
    const noteTime = parseDateTime(note.updatedAt);
    if (noteTime >= startOfToday) {
      todayNotes.push(note);
    } else if (noteTime >= sevenDaysAgo) {
      weekNotes.push(note);
    } else if (noteTime >= thirtyDaysAgo) {
      monthNotes.push(note);
    } else {
      olderNotes.push(note);
    }
  });

  const renderNoteItem = (note: Note) => (
    <SidebarMenuItem key={note.id}>
      <SidebarMenuButton
        isActive={selectedNoteId === note.id}
        onClick={() => onSelectNote(note.id)}
        className="cursor-pointer"
      >
        <BookOpen size={16} />
        <span className="truncate">{note.title || "Untitled Note"}</span>
      </SidebarMenuButton>
      <SidebarMenuAction
        showOnHover
        onClick={(e) => {
          e.stopPropagation();
          setNoteToDelete(note);
        }}
        title="Delete note"
        className="hover:bg-red-500/10 hover:text-red-600 text-muted-foreground transition-colors"
      >
        <Trash2 size={15} className="text-red-500 hover:text-red-600" />
        <span className="sr-only">Delete note</span>
      </SidebarMenuAction>
    </SidebarMenuItem>
  );

  return (
    <Sidebar>
      <SidebarHeader className="gap-3">
        {user && isAuthenticated && (
          <p className="text-sm text-center pt-2">
            Welcome back {user.username}!
          </p>
        )}
        <Button onClick={() => createNewNote()} className="w-full">
          <Plus size={16} />
          New Note
        </Button>

        {/* Note Search Input */}
        <div className="relative w-full">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 pr-7 text-xs rounded-md bg-muted/40 border-border/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {filteredNotes.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            {searchQuery.trim()
              ? `No notes matching "${searchQuery}"`
              : "No notes yet"}
          </div>
        ) : (
          <>
            {/* Group: Today */}
            {todayNotes.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Today ({todayNotes.length})</SidebarGroupLabel>
                <SidebarMenu>
                  {todayNotes.map(renderNoteItem)}
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Group: This Week */}
            {weekNotes.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>This Week ({weekNotes.length})</SidebarGroupLabel>
                <SidebarMenu>
                  {weekNotes.map(renderNoteItem)}
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Group: This Month */}
            {monthNotes.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>This Month ({monthNotes.length})</SidebarGroupLabel>
                <SidebarMenu>
                  {monthNotes.map(renderNoteItem)}
                </SidebarMenu>
              </SidebarGroup>
            )}

            {/* Group: Older */}
            {olderNotes.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Older ({olderNotes.length})</SidebarGroupLabel>
                <SidebarMenu>
                  {olderNotes.map(renderNoteItem)}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user && isAuthenticated ? (
          <>
            <SidebarMenuButton onClick={() => logout()}>
              <DoorOpen size={16} color="red" />
              <span className="text-red-600">Logout</span>
            </SidebarMenuButton>
            <SidebarMenuButton>
              <UserRound size={16} />
              <span>Profile</span>
            </SidebarMenuButton>
          </>
        ) : (
          <>
            <p className="text-xs px-3">Login to keep your notes</p>
            <SidebarMenuButton onClick={() => setIsModalOpen(true)}>
              <UserRound size={16} />
              Login
            </SidebarMenuButton>
            <LoginModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />
          </>
        )}

        <SidebarMenuButton>
          <Settings size={16} />
          <span>Configurations</span>
        </SidebarMenuButton>
      </SidebarFooter>

      <DeleteNoteModal
        note={noteToDelete}
        isOpen={!!noteToDelete}
        onClose={() => setNoteToDelete(null)}
        onConfirm={() => {
          if (noteToDelete) {
            deleteNote(noteToDelete.id);
          }
        }}
      />
    </Sidebar>
  );
}
