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
import { Note } from "@nipponic/shared";
import { BookOpen, Plus, Settings } from "lucide-react";

interface AppSidebarProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
}

export function AppSidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
}: AppSidebarProps) {
  const todayNotes = notes.filter((note) => note.category === "Today");
  const weekNotes = notes.filter((note) => note.category === "This Week");

  return (
    <Sidebar>
      <SidebarHeader>
        <Button onClick={onNewNote}>
          <Plus size={16} />
          New Note
        </Button>
      </SidebarHeader>

      <SidebarContent>
        {/* Group: Today */}
        <SidebarGroup>
          <SidebarGroupLabel>Hoje</SidebarGroupLabel>
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
          <SidebarGroupLabel>This Week</SidebarGroupLabel>
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
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenuButton>
          <Settings size={16} />
          <span>Configurations</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
