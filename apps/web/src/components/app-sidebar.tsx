"use client";

import dynamic from "next/dynamic";

const DeleteNoteModal = dynamic(
  () => import("@/components/delete-note-modal").then((mod) => mod.DeleteNoteModal),
  { ssr: false }
);
const DeleteDeckModal = dynamic(
  () => import("@/components/delete-deck-modal").then((mod) => mod.DeleteDeckModal),
  { ssr: false }
);
const LoginModal = dynamic(
  () => import("@/components/login-modal").then((mod) => mod.LoginModal),
  { ssr: false }
);
const ProfileModal = dynamic(
  () => import("@/components/profile-modal").then((mod) => mod.ProfileModal),
  { ssr: false }
);
const SettingsModal = dynamic(
  () => import("@/components/settings-modal").then((mod) => mod.SettingsModal),
  { ssr: false }
);

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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNotes } from "@/contexts/NotesContext";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { useTutor } from "@/contexts/TutorContext";
import { Note, Deck, AuthMode, AppSidebarProps } from "@nipponic/shared";
import { isCardDue } from "@/lib/srs";
import Link from "next/link";
import {
  BookOpen,
  Check,
  CheckCircle2,
  DoorOpen,
  Globe,
  GraduationCap,
  Heart,
  Layers,
  Loader2,
  Play,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  UserPlus,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { useState, useMemo } from "react";

export type { AppSidebarProps };

export function AppSidebar({
  selectedNoteId,
  onSelectNote,
}: AppSidebarProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();
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

  const {
    curriculum,
    selectedLevel,
    setSelectedLevel,
    selectedTopicId,
    loadLesson,
    isLoadingCurriculum,
    isGeneratingUnit,
    generateNextUnit,
  } = useTutor();

  const [searchQuery, setSearchQuery] = useState("");
  const [deckSearchQuery, setDeckSearchQuery] = useState("");
  const [cloningDeckId, setCloningDeckId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [deckToDelete, setDeckToDelete] = useState<Deck | null>(null);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const q = searchQuery.toLowerCase().trim();
    return notes.filter((note) => {
      const titleMatch = (note.title || "").toLowerCase().includes(q);
      const enMatch = (note.enText || "").toLowerCase().includes(q);
      const jpMatch = (note.jpText || "").toLowerCase().includes(q);
      return titleMatch || enMatch || jpMatch;
    });
  }, [notes, searchQuery]);

  const { todayNotes, weekNotes, monthNotes, olderNotes } = useMemo(() => {
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

    const today: Note[] = [];
    const week: Note[] = [];
    const month: Note[] = [];
    const older: Note[] = [];

    filteredNotes.forEach((note) => {
      const noteTime = parseDateTime(note.updatedAt);
      if (noteTime >= startOfToday) {
        today.push(note);
      } else if (noteTime >= sevenDaysAgo) {
        week.push(note);
      } else if (noteTime >= thirtyDaysAgo) {
        month.push(note);
      } else {
        older.push(note);
      }
    });

    return {
      todayNotes: today,
      weekNotes: week,
      monthNotes: month,
      olderNotes: older,
    };
  }, [filteredNotes]);

  const filteredMyDecks = useMemo(() => {
    if (!deckSearchQuery.trim()) return decks;
    const q = deckSearchQuery.toLowerCase().trim();
    return decks.filter((deck) => (deck.name || "").toLowerCase().includes(q));
  }, [decks, deckSearchQuery]);

  const filteredAppDecks = useMemo(() => {
    if (!deckSearchQuery.trim()) return appDecks;
    const q = deckSearchQuery.toLowerCase().trim();
    return appDecks.filter((deck) => (deck.name || "").toLowerCase().includes(q));
  }, [appDecks, deckSearchQuery]);

  const filteredPublicDecks = useMemo(() => {
    if (!deckSearchQuery.trim()) return publicDecks;
    const q = deckSearchQuery.toLowerCase().trim();
    return publicDecks.filter((deck) => (deck.name || "").toLowerCase().includes(q));
  }, [publicDecks, deckSearchQuery]);

  const renderNoteItem = (note: Note) => (
    <SidebarMenuItem key={note.id}>
      <SidebarMenuButton
        isActive={selectedNoteId === note.id}
        onClick={() => {
          onSelectNote(note.id);
          if (isMobile) {
            setOpenMobile(false);
          }
        }}
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
        {isMobile && (
          <div className="flex items-center justify-between pb-2 border-b border-border/60">
            <div className="flex items-center gap-2 px-1">
              <span className="text-lg">🇯🇵</span>
              <span className="font-bold text-sm tracking-tight">Nipponic</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpenMobile(false)}
              className="h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Close sidebar"
            >
              <X size={16} />
              <span className="sr-only">Close sidebar</span>
            </Button>
          </div>
        )}
        {user && isAuthenticated && (
          <p className="text-xs text-center pt-2 text-muted-foreground">
            Welcome back <span className="font-semibold text-foreground">{user.username}</span>!
          </p>
        )}

        {/* Feature Selector Navigation */}
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
            <span>Cards</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSidebarView("tutor")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all cursor-pointer ${
              activeSidebarView === "tutor"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <GraduationCap size={14} />
            <span>Tutor</span>
          </button>
        </div>

        {activeSidebarView === "notes" ? (
          <>
            <Button
              onClick={async () => {
                await createNewNote();
                if (isMobile) {
                  setOpenMobile(false);
                }
              }}
              className="w-full gap-1.5 cursor-pointer"
            >
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
        ) : activeSidebarView === "flashcards" ? (
          <>
            {/* 3-Tab Deck Switcher */}
            {(() => {
              const myDecksDueCount = decks.filter(
                (d) => d.cards.length > 0 && d.cards.some(isCardDue)
              ).length;

              return (
                <div className="flex p-0.5 bg-muted/60 rounded-lg border border-border/70 text-[11px] font-medium gap-0.5 w-full">
                  <button
                    type="button"
                    onClick={() => setActiveDeckTab("my")}
                    className={`flex-1 py-1.5 px-1 rounded-md transition-all cursor-pointer text-center truncate flex items-center justify-center gap-1 ${
                      activeDeckTab === "my"
                        ? "bg-background text-foreground shadow-xs font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    title={`My Decks (${decks.length})${
                      myDecksDueCount > 0 ? ` - ${myDecksDueCount} with reviews due` : ""
                    }`}
                  >
                    <span className="truncate">My ({decks.length})</span>
                    {myDecksDueCount > 0 && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 shadow-xs"
                        title={`${myDecksDueCount} deck(s) have cards due for review`}
                      />
                    )}
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
                    <span className="truncate">App Decks</span>
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
              );
            })()}

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
        ) : (
          /* Level Selector for Tutor */
          <div className="flex p-0.5 bg-muted/60 rounded-lg border border-border/70 text-[11px] font-medium gap-0.5 w-full">
            {(["N5", "N4", "N3", "N2", "N1"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedLevel(lvl)}
                className={`flex-1 py-1 px-1 rounded-md transition-all cursor-pointer text-center font-bold ${
                  selectedLevel === lvl
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
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
        ) : activeSidebarView === "flashcards" ? (
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
                  {filteredMyDecks.map((deck) => {
                    const hasDueCards =
                      deck.cards.length > 0 && deck.cards.some(isCardDue);
                    const dueCount = deck.cards.filter(isCardDue).length;
                    const isSelected = selectedDeckId === deck.id;

                    return (
                      <SidebarMenuItem key={deck.id} className="relative group/deck">
                        <SidebarMenuButton
                          isActive={isSelected}
                          onClick={() => {
                            setSelectedDeckId(deck.id);
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                          className={`cursor-pointer pr-16 transition-all ${
                            hasDueCards
                              ? isSelected
                                ? "!bg-amber-500/25 dark:!bg-amber-500/30 text-amber-950 dark:text-amber-100 border border-amber-500/60 font-semibold shadow-xs"
                                : "!bg-amber-500/15 dark:!bg-amber-500/20 text-amber-950 dark:text-amber-100 border border-amber-500/35 hover:!bg-amber-500/25 dark:hover:!bg-amber-500/30 hover:border-amber-500/55"
                              : ""
                          }`}
                          title={
                            hasDueCards
                              ? `${deck.name} (${dueCount} card${dueCount > 1 ? "s" : ""} due for review)`
                              : deck.name
                          }
                        >
                          <Layers
                            size={16}
                            className={
                              hasDueCards
                                ? "text-amber-600 dark:text-amber-400 shrink-0"
                                : "shrink-0"
                            }
                          />
                          <span className="truncate flex-1 text-left">
                            {deck.name || "Untitled Deck"}
                          </span>
                          {hasDueCards && (
                            <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-500/20 border border-amber-500/30 px-1 py-0.2 rounded-md flex items-center gap-0.5 shrink-0 mr-1">
                              <Zap size={9} className="fill-current" />
                              {dueCount}
                            </span>
                          )}
                        </SidebarMenuButton>

                        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                          {/* Play Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              startPlayingDeck(deck);
                            }}
                            title={
                              hasDueCards
                                ? `Play due cards (${dueCount} due)`
                                : "Play deck"
                            }
                            className={`p-1 rounded-md transition-colors cursor-pointer ${
                              hasDueCards
                                ? "text-amber-700 dark:text-amber-300 hover:text-amber-950 hover:bg-amber-500/30 dark:hover:text-amber-100"
                                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                            }`}
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
                    );
                  })}
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
                  {filteredAppDecks.map((deck) => {
                    const normalize = (n: string) =>
                      n
                        .trim()
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\bbasico\b/g, "basic")
                        .replace(/\bavancado\b/g, "advanced");
                    const target = normalize(deck.name);
                    const isAlreadyAdded = decks.some(
                      (myDeck) => normalize(myDeck.name) === target
                    );

                    return (
                      <SidebarMenuItem key={deck.id} className="relative group/deck">
                        <SidebarMenuButton
                          isActive={selectedDeckId === deck.id}
                          onClick={() => {
                            setSelectedDeckId(deck.id);
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                          className={`cursor-pointer ${isAlreadyAdded ? "pr-3" : "pr-10"}`}
                        >
                          <Layers size={16} className="text-primary shrink-0" />
                          <span className="truncate flex-1 text-left">{deck.name}</span>
                          {isAlreadyAdded ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                              <Check size={10} />
                              Added
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground shrink-0 mr-6">
                              {deck.cards.length}
                            </span>
                          )}
                        </SidebarMenuButton>

                        {!isAlreadyAdded && (
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
                        )}
                      </SidebarMenuItem>
                    );
                  })}
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
                  {filteredPublicDecks.map((deck) => {
                    const normalize = (n: string) =>
                      n
                        .trim()
                        .toLowerCase()
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/\bbasico\b/g, "basic")
                        .replace(/\bavancado\b/g, "advanced");
                    const target = normalize(deck.name);
                    const isAlreadyAdded = decks.some(
                      (myDeck) => normalize(myDeck.name) === target
                    );

                    return (
                      <SidebarMenuItem key={deck.id} className="relative group/deck">
                        <SidebarMenuButton
                          isActive={selectedDeckId === deck.id}
                          onClick={() => {
                            setSelectedDeckId(deck.id);
                            if (isMobile) {
                              setOpenMobile(false);
                            }
                          }}
                          className={`cursor-pointer ${isAlreadyAdded ? "pr-3" : "pr-10"}`}
                        >
                          <Globe size={16} className="text-blue-500 shrink-0" />
                          <span className="truncate flex-1 text-left">{deck.name}</span>
                          {isAlreadyAdded ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                              <Check size={10} />
                              Added
                            </span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground shrink-0 mr-6">
                              {deck.cards.length}
                            </span>
                          )}
                        </SidebarMenuButton>

                        {!isAlreadyAdded && (
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
                        )}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              )
            )}
          </SidebarGroup>
        ) : (
          /* Tutor Lessons Area */
          <SidebarGroup>
            <div className="flex items-center justify-between px-2 py-1">
              <SidebarGroupLabel className="p-0">
                JLPT {selectedLevel} Lessons {!isLoadingCurriculum && `(${curriculum.length})`}
              </SidebarGroupLabel>
              <button
                type="button"
                onClick={() => generateNextUnit()}
                disabled={isGeneratingUnit || isLoadingCurriculum}
                title="Generate next unit with AI"
                className="text-[11px] text-muted-foreground hover:text-primary flex items-center gap-1 cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGeneratingUnit ? (
                  <Loader2 size={12} className="animate-spin text-primary" />
                ) : (
                  <Sparkles size={12} className="text-primary" />
                )}
                <span>+ Unit</span>
              </button>
            </div>
            {isLoadingCurriculum ? (
              <div className="px-2 py-3 space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse mb-2">
                  <Loader2 size={13} className="animate-spin text-primary shrink-0" />
                  <span className="truncate">Loading JLPT {selectedLevel} lessons...</span>
                </div>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-8 rounded-lg bg-muted/60 animate-pulse w-full flex items-center px-2 gap-2"
                  >
                    <div className="w-4 h-4 rounded-full bg-muted-foreground/20 shrink-0" />
                    <div className="h-3 rounded bg-muted-foreground/20 w-3/4" />
                  </div>
                ))}
              </div>
            ) : curriculum.length === 0 ? (
              <div className="p-6 text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  No lessons loaded for JLPT {selectedLevel}.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateNextUnit()}
                  disabled={isGeneratingUnit}
                  className="w-full text-xs gap-1.5 cursor-pointer font-medium"
                >
                  {isGeneratingUnit ? (
                    <Loader2 size={13} className="animate-spin text-primary" />
                  ) : (
                    <Sparkles size={13} className="text-primary" />
                  )}
                  Generate with AI
                </Button>
              </div>
            ) : (
              <SidebarMenu>
                {curriculum.map((topic) => {
                  const isSelected = selectedTopicId === topic.id;
                  return (
                    <SidebarMenuItem key={topic.id}>
                      <SidebarMenuButton
                        isActive={isSelected}
                        onClick={() => {
                          loadLesson(topic.id);
                          if (isMobile) {
                            setOpenMobile(false);
                          }
                        }}
                        className="cursor-pointer"
                        title={topic.title}
                      >
                        {topic.isCompleted ? (
                          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                        ) : (
                          <BookOpen size={16} className="text-muted-foreground shrink-0" />
                        )}
                        <span className="truncate flex-1 text-left">
                          {topic.lessonIndex}. {topic.title}
                        </span>
                        {topic.completedScore !== undefined && topic.completedScore > 0 && (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded shrink-0">
                            {topic.completedScore}%
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
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
            {isProfileModalOpen && (
              <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
              />
            )}
          </>
        ) : (
          <>
            <p className="text-xs px-3 text-muted-foreground">Sign in to keep your notes and decks</p>
            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                onClick={() => {
                  setAuthModalMode("register");
                  setIsModalOpen(true);
                }}
                className="w-full gap-1.5 cursor-pointer text-xs h-8 font-medium shadow-xs"
              >
                <UserPlus size={14} />
                Create Account
              </Button>
              <SidebarMenuButton
                onClick={() => {
                  setAuthModalMode("login");
                  setIsModalOpen(true);
                }}
                className="cursor-pointer"
              >
                <UserRound size={16} />
                <span>Login</span>
              </SidebarMenuButton>
            </div>
            {isModalOpen && (
              <LoginModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialMode={authModalMode}
              />
            )}
          </>
        )}

        <SidebarMenuButton
          render={<Link href="/sponsors" />}
          className="cursor-pointer text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
        >
          <Heart size={16} className="fill-rose-500/20 text-rose-500" />
          <span>Support Nipponic 💖</span>
        </SidebarMenuButton>

        <SidebarMenuButton
          onClick={() => setIsSettingsModalOpen(true)}
          className="cursor-pointer"
        >
          <Settings size={16} />
          <span>Configurations</span>
        </SidebarMenuButton>
        {isSettingsModalOpen && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
          />
        )}
      </SidebarFooter>

      {noteToDelete && (
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
      )}

      {deckToDelete && (
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
      )}
    </Sidebar>
  );
}
