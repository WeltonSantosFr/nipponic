"use client";

import { DeleteNoteModal } from "@/components/delete-note-modal";
import { DeleteDeckModal } from "@/components/delete-deck-modal";
import { LoginModal } from "@/components/login-modal";
import { ProfileModal } from "@/components/profile-modal";
import { SettingsModal } from "@/components/settings-modal";
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
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { Note, Deck } from "@nipponic/shared";
import {
  BookOpen,
  DoorOpen,
  Layers,
  Play,
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
  const {
    decks,
    createDeck,
    deleteDeck,
    selectedDeckId,
    setSelectedDeckId,
    startPlayingDeck,
    activeSidebarView,
    setActiveSidebarView,
  } = useFlashCards();

  const [searchQuery, setSearchQuery] = useState("");
  const [deckSearchQuery, setDeckSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

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

  const filteredDecks = decks.filter((deck) => {
    if (!deckSearchQuery.trim()) return true;
    const q = deckSearchQuery.toLowerCase().trim();
    return (deck.name || "").toLowerCase().includes(q);
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
      <SidebarHeader className="gap-2.5">
        {user && isAuthenticated && (
          <p className="text-xs text-center pt-2 text-muted-foreground">
            Welcome back <span className="font-semibold text-foreground">{user.username}</span>!
          </p>
        )}

        {/* Feature Selector Slider */}
        <div className="flex p-1 bg-muted/60 rounded-lg border border-border/70 text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveSidebarView("notes")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSidebarView === "notes"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen size={14} />
            <span>Notes</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarView("flashcards")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSidebarView === "flashcards"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers size={14} />
            <span>Flash Cards</span>
          </button>
        </div>

        {activeSidebarView === "notes" ? (
          <>
            <Button onClick={() => createNewNote()} className="w-full gap-1.5 cursor-pointer">
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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <Button
              onClick={() => createDeck("New Deck")}
              className="w-full gap-1.5 cursor-pointer"
            >
              <Plus size={16} />
              New Deck
            </Button>

            {/* Deck Search Input */}
            <div className="relative w-full">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search decks..."
                value={deckSearchQuery}
                onChange={(e) => setDeckSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs rounded-md bg-muted/40 border-border/60"
              />
              {deckSearchQuery && (
                <button
                  type="button"
                  onClick={() => setDeckSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </>
        )}
      </SidebarHeader>

      <SidebarContent>
        {activeSidebarView === "notes" ? (
          filteredNotes.length === 0 ? (
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
          )
        ) : (
          /* Flash Cards Decks List */
          <SidebarGroup>
            <SidebarGroupLabel>
              Decks ({filteredDecks.length})
            </SidebarGroupLabel>
            {filteredDecks.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {deckSearchQuery.trim()
                  ? `No decks matching "${deckSearchQuery}"`
                  : "No decks yet. Click '+ New Deck' above to create one."}
              </div>
            ) : (
              <SidebarMenu>
                {filteredDecks.map((deck) => (
                  <SidebarMenuItem key={deck.id} className="relative group/deck">
                    <SidebarMenuButton
                      isActive={selectedDeckId === deck.id}
                      onClick={() => setSelectedDeckId(deck.id)}
                      className="cursor-pointer pr-16"
                    >
                      <Layers size={16} />
                      <span className="truncate">{deck.name || "Untitled Deck"}</span>
                    </SidebarMenuButton>

                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                      {/* Badge or Play Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startPlayingDeck(deck);
                        }}
                        title="Play deck"
                        className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        <Play size={13} className="fill-current" />
                        <span className="sr-only">Play deck</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeckToDelete(deck);
                        }}
                        title="Delete deck"
                        className="p-1 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span className="sr-only">Delete deck</span>
                      </button>
                    </div>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            )}
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {user && isAuthenticated ? (
          <>
            <SidebarMenuButton onClick={() => logout()}>
              <DoorOpen size={16} color="red" />
              <span className="text-red-600">Logout</span>
            </SidebarMenuButton>
            <SidebarMenuButton
              onClick={() => setIsProfileModalOpen(true)}
              className="cursor-pointer"
            >
              <UserRound size={16} />
              <span>Profile</span>
            </SidebarMenuButton>
            <ProfileModal
              isOpen={isProfileModalOpen}
              onClose={() => setIsProfileModalOpen(false)}
            />
          </>
        ) : (
          <>
            <p className="text-xs px-3">Login to keep your notes and decks</p>
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

        <SidebarMenuButton
          onClick={() => setIsSettingsModalOpen(true)}
          className="cursor-pointer"
        >
          <Settings size={16} />
          <span>Configurations</span>
        </SidebarMenuButton>
        <SettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
        />
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

      <DeleteDeckModal
        deck={deckToDelete}
        isOpen={!!deckToDelete}
        onClose={() => setDeckToDelete(null)}
        onConfirm={() => {
          if (deckToDelete) {
            deleteDeck(deckToDelete.id);
          }
        }}
      />
    </Sidebar>
  );
}
