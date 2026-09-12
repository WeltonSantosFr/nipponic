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
import { Card, SettingsTab } from "@nipponic/shared";
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
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type { SettingsTab };

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("glossary");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-3xl md:max-w-4xl h-[620px] max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Configurations</DialogTitle>
          <DialogDescription>
            Application settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row flex-1 h-full min-h-0 overflow-hidden">
          {/* Internal Sidebar */}
          <aside className="w-full sm:w-56 bg-muted/25 border-b sm:border-b-0 sm:border-r border-border/70 flex flex-row sm:flex-col p-2.5 sm:p-3.5 gap-2 sm:gap-1 shrink-0 items-center sm:items-stretch">
            <div className="flex items-center gap-2 px-2 py-1 sm:py-2 sm:mb-2 text-foreground font-semibold text-sm shrink-0">
              <Settings size={17} className="text-primary" />
              <span>Configurations</span>
            </div>

            <nav className="flex flex-row sm:flex-col gap-1 w-full flex-1">
              <GlossarySidebarTab
                isActive={activeTab === "glossary"}
                onClick={() => setActiveTab("glossary")}
              />
              <FlashCardsSidebarTab
                isActive={activeTab === "flashcards"}
                onClick={() => setActiveTab("flashcards")}
              />
              <AppearanceSidebarTab
                isActive={activeTab === "appearance"}
                onClick={() => setActiveTab("appearance")}
              />
            </nav>
          </aside>

          {/* Settings Main Content Area */}
          <main className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-4 sm:p-6">
            {activeTab === "glossary" && <GlossarySettingsSection />}
            {activeTab === "flashcards" && <FlashCardsSettingsSection />}
            {activeTab === "appearance" && <AppearanceSettingsSection />}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GlossarySidebarTab({
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
      onClick={onClick}
      className={`flex-1 sm:w-full flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
        isActive
          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <BookMarked size={14} />
        <span>Glossary</span>
      </div>
      <Badge
        variant={isActive ? "secondary" : "outline"}
        className="text-[10px] px-1.5 py-0 h-4 ml-1"
      >
        {rules.length}
      </Badge>
    </button>
  );
}

function FlashCardsSidebarTab({
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
      onClick={onClick}
      className={`flex-1 sm:w-full flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
        isActive
          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Layers size={14} />
        <span>Flash Cards</span>
      </div>
      <Badge
        variant={isActive ? "secondary" : "outline"}
        className="text-[10px] px-1.5 py-0 h-4 ml-1"
      >
        {cards.length}
      </Badge>
    </button>
  );
}

function AppearanceSidebarTab({
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
      onClick={onClick}
      className={`flex-1 sm:w-full flex items-center justify-between px-2.5 py-1.5 sm:py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
        isActive
          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        <Palette size={14} />
        <span>Appearance</span>
      </div>
      <Badge
        variant={isActive ? "secondary" : "outline"}
        className="text-[10px] px-1.5 py-0 h-4 ml-1 capitalize"
      >
        {theme || "Dark"}
      </Badge>
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
