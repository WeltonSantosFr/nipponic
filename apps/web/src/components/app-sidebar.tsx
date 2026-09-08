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
  Globe,
  Layers,
  Loader2,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
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
    appDecks,
    publicDecks,
    activeDeckTab,
    setActiveDeckTab,
    createDeck,
    deleteDeck,
    selectedDeckId,
    setSelectedDeckId,
    startPlayingDeck,
    activeSidebarView,
    setActiveSidebarView,
    addDeckToMyDecks,
  } = useFlashCards();

  const [searchQuery, setSearchQuery] = useState("");
  const [deckSearchQuery, setDeckSearchQuery] = useState("");
  const [cloningDeckId, setCloningDeckId] = useState<string | null>(null);
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
    const enMatch = (note.enText || "").toLowerCase().includes(q);
    const jpMatch = (note.jpText || "").toLowerCase().includes(q);
    return titleMatch || enMatch || jpMatch;
  });

  const filteredMyDecks = decks.filter((deck) => {
    if (!deckSearchQuery.trim()) return true;
    const q = deckSearchQuery.toLowerCase().trim();
    return (deck.name || "").toLowerCase().includes(q);
  });

  const filteredAppDecks = appDecks.filter((deck) => {
    if (!deckSearchQuery.trim()) return true;
    const q = deckSearchQuery.toLowerCase().trim();
    return (deck.name || "").toLowerCase().includes(q);
  });

  const filteredPublicDecks = publicDecks.filter((deck) => {
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
            {/* 3-Tab Deck Switcher */}
            <div className="flex p-0.5 bg-muted/60 rounded-lg border border-border/70 text-[11px] font-medium gap-0.5 w-full">
              <button
                type="button"
                onClick={() => setActiveDeckTab("my")}
                className={`flex-1 py-1.5 px-1 rounded-md transition-all cursor-pointer text-center truncate ${
                  activeDeckTab === "my"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`My Decks (${decks.length})`}
              >
                My Decks ({decks.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveDeckTab("app")}
                className={`flex-1 py-1.5 px-1 rounded-md transition-all cursor-pointer text-center truncate ${
                  activeDeckTab === "app"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="App Decks"
              >
                App Decks
              </button>
              <button
                type="button"
                onClick={() => setActiveDeckTab("public")}
                className={`flex-1 py-1.5 px-1 rounded-md transition-all cursor-pointer text-center truncate ${
                  activeDeckTab === "public"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Public Decks (${publicDecks.length})`}
              >
                Public ({publicDecks.length})
              </button>
            </div>

            {activeDeckTab === "my" ? (
              <Button
                onClick={() => createDeck("New Deck")}
                className="w-full gap-1.5 cursor-pointer"
              >
                <Plus size={16} />
                New Deck
              </Button>
            ) : null}

            {/* Deck Search Input */}
            <div className="relative w-full">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                type="text"
                placeholder={
                  activeDeckTab === "my"
                    ? "Search my decks..."
                    : activeDeckTab === "app"
                    ? "Search app decks..."
                    : "Search public decks..."
                }
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
          /* Flash Cards Decks Area */
          <SidebarGroup>
            {activeDeckTab === "my" && (
              filteredMyDecks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {deckSearchQuery.trim()
                    ? `No decks matching "${deckSearchQuery}"`
                    : "No decks yet. Click '+ New Deck' above to create one."}
                </div>
              ) : (
                <SidebarMenu>
                  {filteredMyDecks.map((deck) => (
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
                        {/* Play Button */}
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
              )
            )}

            {activeDeckTab === "app" && (
              filteredAppDecks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  No app decks found
                </div>
              ) : (
                <SidebarMenu>
                  {filteredAppDecks.map((deck) => (
                    <SidebarMenuItem key={deck.id} className="relative group/deck">
                      <SidebarMenuButton
                        isActive={selectedDeckId === deck.id}
                        onClick={() => setSelectedDeckId(deck.id)}
                        className="cursor-pointer pr-10"
                      >
                        <Layers size={16} className="text-primary shrink-0" />
                        <span className="truncate flex-1 text-left">{deck.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 mr-6">
                          {deck.cards.length}
                        </span>
                      </SidebarMenuButton>

                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setCloningDeckId(deck.id);
                            await addDeckToMyDecks(deck);
                            setCloningDeckId(null);
                          }}
                          disabled={cloningDeckId === deck.id}
                          title="Add to My Decks"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          {cloningDeckId === deck.id ? (
                            <Loader2 size={14} className="animate-spin text-primary" />
                          ) : (
                            <Plus size={15} />
                          )}
                          <span className="sr-only">Add to My Decks</span>
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )
            )}

            {activeDeckTab === "public" && (
              filteredPublicDecks.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground">
                  {deckSearchQuery.trim()
                    ? `No public decks matching "${deckSearchQuery}"`
                    : "No public decks from other users available yet."}
                </div>
              ) : (
                <SidebarMenu>
                  {filteredPublicDecks.map((deck) => (
                    <SidebarMenuItem key={deck.id} className="relative group/deck">
                      <SidebarMenuButton
                        isActive={selectedDeckId === deck.id}
                        onClick={() => setSelectedDeckId(deck.id)}
                        className="cursor-pointer pr-10"
                      >
                        <Globe size={16} className="text-blue-500 shrink-0" />
                        <span className="truncate flex-1 text-left">{deck.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 mr-6">
                          {deck.cards.length}
                        </span>
                      </SidebarMenuButton>

                      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setCloningDeckId(deck.id);
                            await addDeckToMyDecks(deck);
                            setCloningDeckId(null);
                          }}
                          disabled={cloningDeckId === deck.id}
                          title="Add to My Decks"
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          {cloningDeckId === deck.id ? (
                            <Loader2 size={14} className="animate-spin text-primary" />
                          ) : (
                            <Plus size={15} />
                          )}
                          <span className="sr-only">Add to My Decks</span>
                        </button>
                      </div>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              )
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
