import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/contexts/NotesContext";
import { BookOpen, Plus, Settings, UserRound } from "lucide-react";
import { useState } from "react";

interface AppSidebarProps {
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;

}
Settings;
export function AppSidebar({
  selectedNoteId,
  onSelectNote,
}: AppSidebarProps) {
  const { user, isAuthenticated } = useAuth();
  const { notes } = useNotes()
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const now = new Date()
  const todayString = now.toDateString()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const todayNotes = notes.filter((note) => {
    return new Date(note.updatedAt).toDateString() === todayString
  });
  const weekNotes = notes.filter((note) => {
    const noteDate = new Date(note.updatedAt)

    if (noteDate.toDateString() === todayString) return false

    const diffTime = Math.abs(now.getTime() - noteDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays <= 7
  });

  const monthNotes = notes.filter((note) => {
    const noteDate = new Date(note.updatedAt)

    const isSameMonth = noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear
  
    const isAlreadyInToday = noteDate.toDateString() === todayString;
    const diffDays = Math.ceil(Math.abs(now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24));
    const isAlreadyInWeek = diffDays <= 7 && !isAlreadyInToday;

    return isSameMonth && !isAlreadyInToday && !isAlreadyInWeek
  })

  const olderNotes = notes.filter((note) => {
    const noteDate = new Date(note.updatedAt)

    const isPreviousYear = noteDate.getFullYear() < currentYear
    const isPreviousMonthSameYear = noteDate.getFullYear() === currentYear && noteDate.getMonth() < currentMonth

    return isPreviousYear || isPreviousMonthSameYear
  })

  return (
    <Sidebar>
      <SidebarHeader>
        {user && isAuthenticated && (
          <p className="text-sm text-center p-3">Welcome back {user.username}!</p>
        )}
        <Button>
          <Plus size={16} />
          New Note
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {/* Group: Today */}
        <SidebarGroup>
          <SidebarGroupLabel>Today {todayNotes.length}</SidebarGroupLabel>
          <SidebarMenu>
            {todayNotes.map((note) => (
              <SidebarMenuItem key={note.id}>
                <SidebarMenuButton
                  isActive={selectedNoteId === note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span className="truncate">{note.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Group: This Week */}
        <SidebarGroup>
          <SidebarGroupLabel>This Week {weekNotes.length}</SidebarGroupLabel>
          <SidebarMenu>
            {weekNotes.map((note) => (
              <SidebarMenuItem key={note.id}>
                <SidebarMenuButton
                  isActive={selectedNoteId === note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span className="truncate">{note.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Group: This Month */}
        <SidebarGroup>
          <SidebarGroupLabel>This Month {monthNotes.length}</SidebarGroupLabel>
          <SidebarMenu>
            {monthNotes.map((note) => (
              <SidebarMenuItem key={note.id}>
                <SidebarMenuButton
                  isActive={selectedNoteId === note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span className="truncate">{note.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* Group: Older */}
        <SidebarGroup>
          <SidebarGroupLabel>Older {olderNotes.length}</SidebarGroupLabel>
          <SidebarMenu>
            {olderNotes.map((note) => (
              <SidebarMenuItem key={note.id}>
                <SidebarMenuButton
                  isActive={selectedNoteId === note.id}
                  onClick={() => onSelectNote(note.id)}
                  className="cursor-pointer"
                >
                  <BookOpen size={16} />
                  <span className="truncate">{note.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user && isAuthenticated ? (
          <>
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
    </Sidebar>
  );
}
