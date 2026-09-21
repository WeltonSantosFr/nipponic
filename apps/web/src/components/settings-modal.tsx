"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useGlossaryRules } from "@/services/glossary";
import { useFlashCards } from "@/contexts/FlashCardsContext";
import { useSpeech } from "@/hooks/use-speech";
import { Card, SettingsTab, SettingsModalProps } from "@nipponic/shared";
import {
  BookMarked,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
  Check,
  Layers,
  Volume2,
  Sun,
  Moon,
  Palette,
  Bell,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  getNotificationSettings,
  saveNotificationSettings,
  requestNotificationPermission,
  sendTestNotification,
  syncCardNotifications,
  type NotificationSettings,
} from "@/services/notifications";

export type { SettingsTab, SettingsModalProps };

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("glossary");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-3xl md:max-w-4xl h-[620px] max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-border/80">
        {/* Modal Header */}
        <div className="w-full min-w-0 border-b border-border/70 bg-muted/20 shrink-0">
          {/* Top Line: Icon & Title */}
          <div className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2 pr-12 w-full">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                <Settings size={18} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-tight truncate">
                  Configurations
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground hidden sm:block truncate">
                  Application preferences, glossary, flashcards, and notifications
                </DialogDescription>
              </div>
            </div>
          </div>

          {/* Bottom Line: Category tabs with horizontal scroll */}
          <div className="w-full min-w-0 overflow-x-auto scrollbar-none px-4 sm:px-6 pb-2.5 pt-0.5">
            <nav
              className="flex items-center gap-2 min-w-max"
              role="tablist"
              aria-label="Configuration categories"
            >
              <GlossaryTabButton
                isActive={activeTab === "glossary"}
                onClick={() => setActiveTab("glossary")}
              />
              <FlashCardsTabButton
                isActive={activeTab === "flashcards"}
                onClick={() => setActiveTab("flashcards")}
              />
              <AppearanceTabButton
                isActive={activeTab === "appearance"}
                onClick={() => setActiveTab("appearance")}
              />
              <NotificationsTabButton
                isActive={activeTab === "notifications"}
                onClick={() => setActiveTab("notifications")}
              />
            </nav>
          </div>
        </div>

        {/* Settings Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 w-full">
          {activeTab === "glossary" && <GlossarySettingsSection />}
          {activeTab === "flashcards" && <FlashCardsSettingsSection />}
          {activeTab === "appearance" && <AppearanceSettingsSection />}
          {activeTab === "notifications" && <NotificationsSettingsSection />}
        </main>
      </DialogContent>
    </Dialog>
  );
}

function GlossaryTabButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  const { rules } = useGlossaryRules();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
          : "bg-background/80 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground hover:border-border"
      }`}
    >
      <BookMarked size={14} className="shrink-0" />
      <span className="whitespace-nowrap">Glossary</span>
      <Badge
        variant={isActive ? "secondary" : "outline"}
        className="text-[10px] px-1.5 py-0 h-4 ml-0.5 shrink-0"
      >
        {rules.length}
      </Badge>
    </button>
  );
}

function FlashCardsTabButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  const { cards } = useFlashCards();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
          : "bg-background/80 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground hover:border-border"
      }`}
    >
      <Layers size={14} className="shrink-0" />
      <span className="whitespace-nowrap">Flashcards</span>
      <Badge
        variant={isActive ? "secondary" : "outline"}
        className="text-[10px] px-1.5 py-0 h-4 ml-0.5 shrink-0"
      >
        {cards.length}
      </Badge>
    </button>
  );
}

function AppearanceTabButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  const { theme } = useTheme();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
          : "bg-background/80 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground hover:border-border"
      }`}
    >
      <Palette size={14} className="shrink-0" />
      <span className="whitespace-nowrap">Appearance</span>
      <Badge
        variant={isActive ? "secondary" : "outline"}
        className="text-[10px] px-1.5 py-0 h-4 ml-0.5 shrink-0 capitalize"
      >
        {theme || "Dark"}
      </Badge>
    </button>
  );
}

function NotificationsTabButton({
  isActive,
  onClick,
}: {
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 px-3 py-1.5 sm:py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
        isActive
          ? "bg-primary text-primary-foreground border-primary shadow-xs font-semibold"
          : "bg-background/80 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground hover:border-border"
      }`}
    >
      <Bell size={14} className="shrink-0" />
      <span className="whitespace-nowrap">Notifications</span>
    </button>
  );
}

function GlossarySettingsSection() {
  const { rules, addRule, updateRule, removeRule } = useGlossaryRules();
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [sourceTerm, setSourceTerm] = useState("");
  const [targetTerm, setTargetTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setSourceTerm("");
    setTargetTerm("");
    setEditingId(null);
  };

  const handleStartEdit = (rule: { id: string; sourceTerm: string; targetTerm: string }) => {
    setEditingId(rule.id);
    setSourceTerm(rule.sourceTerm);
    setTargetTerm(rule.targetTerm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTerm.trim() || !targetTerm.trim()) return;

    if (editingId) {
      updateRule(editingId, sourceTerm, targetTerm);
    } else {
      addRule(sourceTerm, targetTerm);
    }
    resetForm();
  };

  const filteredRules = rules.filter((rule) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      rule.sourceTerm.toLowerCase().includes(q) ||
      rule.targetTerm.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <BookMarked className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">
            Translation Glossary
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Manage words and phrases that should always be translated with your
          preferred Japanese vocabulary or kanji.
        </p>
      </div>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-muted/40 rounded-lg border border-border/80 flex flex-col gap-3 shrink-0"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {editingId ? (
              <>
                <Pencil size={13} className="text-primary" />
                Edit Glossary Term
              </>
            ) : (
              <>
                <Plus size={13} className="text-primary" />
                Add New Term
              </>
            )}
          </span>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="source-term" className="text-xs">
              English Term
            </Label>
            <Input
              id="source-term"
              placeholder="e.g. coffee shop"
              value={sourceTerm}
              onChange={(e) => setSourceTerm(e.target.value)}
              required
              className="h-8 text-xs bg-background"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="target-term" className="text-xs">
              Preferred Japanese
            </Label>
            <Input
              id="target-term"
              placeholder="e.g. 喫茶店"
              value={targetTerm}
              onChange={(e) => setTargetTerm(e.target.value)}
              required
              className="h-8 text-xs bg-background"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {editingId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!sourceTerm.trim() || !targetTerm.trim()}
            className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
          >
            {editingId ? (
              <>
                <Check size={14} />
                Update Term
              </>
            ) : (
              <>
                <Plus size={14} />
                Add Term
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Search & Rules Count */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Terms ({filteredRules.length}
            {searchQuery.trim() ? ` of ${rules.length}` : ""})
          </span>

          <div className="relative w-full sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Filter terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-8 pr-7 text-xs rounded-md bg-muted/30 border-border/70 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-36 pr-1">
        {filteredRules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg flex flex-col items-center justify-center gap-1.5">
            <BookMarked size={20} className="text-muted-foreground/60" />
            <span>
              {searchQuery.trim()
                ? `No glossary terms found matching "${searchQuery}"`
                : "No glossary terms saved yet. Add one above to get started."}
            </span>
          </div>
        ) : (
          filteredRules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all text-xs ${
                editingId === rule.id
                  ? "bg-primary/5 border-primary shadow-xs"
                  : "bg-card text-card-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <span className="font-semibold text-foreground truncate max-w-[110px] sm:max-w-56">
                  {rule.sourceTerm}
                </span>
                <span className="text-muted-foreground font-mono shrink-0">→</span>
                <span className="font-bold text-primary truncate max-w-[110px] sm:max-w-56">
                  {rule.targetTerm}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  onClick={() => handleStartEdit(rule)}
                  title="Edit term"
                >
                  <Pencil size={13} />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                  onClick={() => {
                    if (editingId === rule.id) resetForm();
                    removeRule(rule.id);
                  }}
                  title="Delete term"
                >
                  <Trash2 size={13} />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FlashCardsSettingsSection() {
  const { cards, createCard, updateCard, deleteCard } = useFlashCards();
  const { speak, isPlaying } = useSpeech();
  const [searchQuery, setSearchQuery] = useState("");

  // Form states
  const [jpText, setJpText] = useState("");
  const [enText, setEnText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const resetForm = () => {
    setJpText("");
    setEnText("");
    setEditingId(null);
  };

  const handleStartEdit = (card: Card) => {
    setEditingId(card.id);
    setJpText(card.jpText);
    setEnText(card.enText);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jpText.trim() || !enText.trim()) return;

    if (editingId) {
      await updateCard(editingId, { jpText: jpText.trim(), enText: enText.trim() });
    } else {
      await createCard({ jpText: jpText.trim(), enText: enText.trim() });
    }
    resetForm();
  };

  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      card.jpText.toLowerCase().includes(q) ||
      card.enText.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col h-full gap-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">
            Flash Cards Arsenal
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your master collection of flash cards. Add, edit, or search cards
          across Japanese and English.
        </p>
      </div>

      {/* Add / Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="p-4 bg-muted/40 rounded-lg border border-border/80 flex flex-col gap-3 shrink-0"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            {editingId ? (
              <>
                <Pencil size={13} className="text-primary" />
                Edit Card
              </>
            ) : (
              <>
                <Plus size={13} className="text-primary" />
                Add New Flash Card
              </>
            )}
          </span>
          {editingId && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetForm}
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Cancel Edit
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label htmlFor="card-jp-text" className="text-xs">
              Japanese Text (Front)
            </Label>
            <Input
              id="card-jp-text"
              placeholder="e.g. 友達 (ともだち)"
              value={jpText}
              onChange={(e) => setJpText(e.target.value)}
              required
              className="h-8 text-xs bg-background font-japanese"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="card-en-text" className="text-xs">
              English Meaning (Back)
            </Label>
            <Input
              id="card-en-text"
              placeholder="e.g. Friend"
              value={enText}
              onChange={(e) => setEnText(e.target.value)}
              required
              className="h-8 text-xs bg-background"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          {editingId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetForm}
              className="h-8 px-3 text-xs cursor-pointer"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!jpText.trim() || !enText.trim()}
            className="h-8 px-3 text-xs gap-1.5 cursor-pointer"
          >
            {editingId ? (
              <>
                <Check size={14} />
                Update Card
              </>
            ) : (
              <>
                <Plus size={14} />
                Add Card
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Search & Cards Count */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Arsenal Cards ({filteredCards.length}
            {searchQuery.trim() ? ` of ${cards.length}` : ""})
          </span>

          <div className="relative w-full sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Search Japanese or English..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-8 pr-7 text-xs rounded-md bg-muted/30 border-border/70 w-full"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Clear filter"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-36 pr-1">
        {filteredCards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs border border-dashed rounded-lg flex flex-col items-center justify-center gap-1.5">
            <Layers size={20} className="text-muted-foreground/60" />
            <span>
              {searchQuery.trim()
                ? `No flash cards found matching "${searchQuery}"`
                : "No flash cards in your arsenal yet. Add your first card above."}
            </span>
          </div>
        ) : (
          filteredCards.map((card) => (
            <div
              key={card.id}
              className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all text-xs ${
                editingId === card.id
                  ? "bg-primary/5 border-primary shadow-xs"
                  : "bg-card text-card-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden min-w-0">
                <div className="flex items-center gap-1 shrink-0 max-w-[120px] sm:max-w-48">
                  <span className="font-bold text-foreground font-japanese text-xs sm:text-sm truncate">
                    {card.jpText}
                  </span>
                  <button
                    type="button"
                    onClick={() => speak(card.jpText, "ja-JP")}
                    disabled={isPlaying}
                    className="p-0.5 sm:p-1 text-muted-foreground hover:text-primary transition-colors cursor-pointer shrink-0"
                    title="Pronounce Japanese"
                  >
                    <Volume2 size={13} />
                  </button>
                </div>
                <span className="text-muted-foreground font-mono shrink-0">→</span>
                <span className="font-medium text-muted-foreground truncate max-w-[110px] sm:max-w-56">
                  {card.enText}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                  onClick={() => handleStartEdit(card)}
                  title="Edit card"
                >
                  <Pencil size={13} />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 cursor-pointer"
                  onClick={() => {
                    if (editingId === card.id) resetForm();
                    deleteCard(card.id);
                  }}
                  title="Delete card"
                >
                  <Trash2 size={13} />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AppearanceSettingsSection() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const currentTheme = theme || "dark";

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold tracking-tight">Theme & Appearance</h2>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Select your preferred visual style for Nipponic. Choose between Light and Dark mode.
        </p>
      </div>

      {/* Theme Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Light Theme Option */}
        <div
          onClick={() => setTheme("light")}
          className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-3 group ${
            currentTheme === "light"
              ? "border-primary bg-primary/[0.04] shadow-sm"
              : "border-border/80 hover:border-border hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center">
                <Sun size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Light Mode</h3>
                <p className="text-[11px] text-muted-foreground">Clear, high-contrast look</p>
              </div>
            </div>

            <div
              className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                currentTheme === "light"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40"
              }`}
            >
              {currentTheme === "light" && <Check size={12} strokeWidth={3} />}
            </div>
          </div>

          {/* Light Mode Mock Preview */}
          <div className="rounded-lg border border-zinc-200 bg-white p-3 space-y-2 select-none shadow-xs">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-16 bg-zinc-800 rounded" />
              <div className="h-2 w-8 bg-emerald-600 rounded-full" />
            </div>
            <div className="h-2 w-full bg-zinc-200 rounded" />
            <div className="h-2 w-3/4 bg-zinc-100 rounded" />
          </div>
        </div>

        {/* Dark Theme Option */}
        <div
          onClick={() => setTheme("dark")}
          className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col gap-3 group ${
            currentTheme === "dark"
              ? "border-primary bg-primary/[0.04] shadow-sm"
              : "border-border/80 hover:border-border hover:bg-muted/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <Moon size={18} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Dark Mode</h3>
                <p className="text-[11px] text-muted-foreground">Gentle on the eyes at night</p>
              </div>
            </div>

            <div
              className={`h-5 w-5 rounded-full border flex items-center justify-center transition-colors ${
                currentTheme === "dark"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/40"
              }`}
            >
              {currentTheme === "dark" && <Check size={12} strokeWidth={3} />}
            </div>
          </div>

          {/* Dark Mode Mock Preview */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 space-y-2 select-none shadow-xs">
            <div className="flex items-center justify-between">
              <div className="h-2.5 w-16 bg-zinc-100 rounded" />
              <div className="h-2 w-8 bg-emerald-500 rounded-full" />
            </div>
            <div className="h-2 w-full bg-zinc-800 rounded" />
            <div className="h-2 w-3/4 bg-zinc-700 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationsSettingsSection() {
  const { cards } = useFlashCards();
  const [settings, setSettings] = useState<NotificationSettings>(getNotificationSettings);
  const [testState, setTestState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const updateSetting = async <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    if (key === "enabled" && value === true) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        console.warn("Notification permission was not granted by the user/OS.");
      }
    }

    const next = { ...settings, [key]: value };
    setSettings(next);
    saveNotificationSettings(next);
    syncCardNotifications(cards).catch(() => {});
  };

  const handleTestNotification = async () => {
    setTestState("sending");
    const success = await sendTestNotification();
    if (success) {
      setTestState("sent");
      setTimeout(() => setTestState("idle"), 4000);
    } else {
      setTestState("error");
      setTimeout(() => setTestState("idle"), 4000);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="border-b pb-4">
        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
          <Bell size={18} className="text-primary" />
          <span>Study &amp; Review Notifications</span>
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Receive intelligent, battery-friendly local reminders on your device to keep your Japanese studies on track.
        </p>
      </div>

      {/* Master Enable/Disable Switch */}
      <div className="flex items-center justify-between p-4 rounded-xl border bg-card text-card-foreground shadow-xs">
        <div className="space-y-0.5">
          <Label className="text-sm font-semibold text-foreground">
            Allow Notifications
          </Label>
          <p className="text-xs text-muted-foreground">
            Enable or disable all notifications from Nipponic.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => updateSetting("enabled", !settings.enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            settings.enabled ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              settings.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Detailed Notification Options */}
      <div className={`space-y-4 transition-opacity ${settings.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}>
        {/* Daily Study Reminder */}
        <div className="p-4 rounded-xl border bg-card/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-foreground">Daily Study Reminder</h3>
                <p className="text-[11px] text-muted-foreground">
                  A daily reminder to build a steady Japanese habit.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              disabled={!settings.enabled}
              aria-checked={settings.dailyReminder}
              onClick={() => updateSetting("dailyReminder", !settings.dailyReminder)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.dailyReminder ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.dailyReminder ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {settings.dailyReminder && (
            <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
              <span className="text-muted-foreground">Reminder Time</span>
              <Input
                type="time"
                value={settings.dailyTime}
                onChange={(e) => updateSetting("dailyTime", e.target.value)}
                className="w-28 h-8 text-xs font-mono text-center bg-background"
              />
            </div>
          )}
        </div>

        {/* 15-Cards Overdue Alert */}
        <div className="p-4 rounded-xl border bg-card/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Layers size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-sm font-semibold text-foreground">15 Overdue Cards Alert</h3>
                  <Badge variant="outline" className="text-[10px] font-mono py-0 h-4 border-amber-500/30 text-amber-600 dark:text-amber-400">
                    Smart Batch
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Alerts you when 15 or more cards accumulate for review (max 1x per day, quiet at night).
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              disabled={!settings.enabled}
              aria-checked={settings.overdueAlert}
              onClick={() => updateSetting("overdueAlert", !settings.overdueAlert)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.overdueAlert ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  settings.overdueAlert ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Test Notification Button */}
        <div className="p-4 rounded-xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-semibold text-foreground">Test Notifications on Device</h4>
            <p className="text-[11px] text-muted-foreground">
              Sends a test notification 2 seconds after clicking to verify sound and banner.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleTestNotification}
            disabled={!settings.enabled || testState === "sending"}
            className="h-8 gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
          >
            <Sparkles size={13} className="text-primary" />
            <span>
              {testState === "sending"
                ? "Scheduling..."
                : testState === "sent"
                ? "Notification sent!"
                : "Test Notification"}
            </span>
          </Button>
        </div>

        {testState === "sent" && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <Check size={14} />
            <span>Test notification scheduled! Check your device notifications in a few seconds.</span>
          </div>
        )}

        {testState === "error" && (
          <div className="p-2.5 rounded-lg bg-destructive/10 text-destructive text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={14} />
            <span>Could not send notification. Ensure notification permissions are allowed for Nipponic.</span>
          </div>
        )}
      </div>
    </div>
  );
}

