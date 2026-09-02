"use client";

import { useState } from "react";
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
import {
  BookMarked,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  X,
  Check,
} from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SettingsTab = "glossary";

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>("glossary");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl md:max-w-4xl h-[620px] max-h-[90vh] p-0 overflow-hidden flex flex-col gap-0 border-border/80">
        <DialogHeader className="sr-only">
          <DialogTitle>Configurations</DialogTitle>
          <DialogDescription>
            Application settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 h-full min-h-0 overflow-hidden">
          {/* Internal Sidebar */}
          <aside className="w-48 sm:w-56 bg-muted/25 border-r border-border/70 flex flex-col p-3.5 gap-1 shrink-0">
            <div className="flex items-center gap-2 px-2 py-2 mb-2 text-foreground font-semibold text-sm">
              <Settings size={17} className="text-primary" />
              <span>Configurations</span>
            </div>

            <nav className="space-y-1">
              <GlossarySidebarTab
                isActive={activeTab === "glossary"}
                onClick={() => setActiveTab("glossary")}
              />
            </nav>
          </aside>

          {/* Settings Main Content Area */}
          <main className="flex-1 flex flex-col h-full min-h-0 overflow-y-auto p-6">
            {activeTab === "glossary" && <GlossarySettingsSection />}
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
      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
        isActive
          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <div className="flex items-center gap-2">
        <BookMarked size={15} />
        <span>Glossary</span>
      </div>
      <Badge
        variant={isActive ? "secondary" : "outline"}
        className="text-[10px] px-1.5 py-0 h-4"
      >
        {rules.length}
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
              className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground"
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
              className="h-8 px-3 text-xs"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            disabled={!sourceTerm.trim() || !targetTerm.trim()}
            className="h-8 px-3 text-xs gap-1.5"
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
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Saved Terms ({filteredRules.length}
            {searchQuery.trim() ? ` of ${rules.length}` : ""})
          </span>

          <div className="relative w-48 sm:w-60">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Filter terms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 pl-8 pr-7 text-xs rounded-md bg-muted/30 border-border/70"
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
              className={`flex items-center justify-between p-3 rounded-lg border transition-all text-xs ${
                editingId === rule.id
                  ? "bg-primary/5 border-primary shadow-xs"
                  : "bg-card text-card-foreground hover:border-border"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="font-semibold text-foreground truncate max-w-44 sm:max-w-56">
                  {rule.sourceTerm}
                </span>
                <span className="text-muted-foreground font-mono">→</span>
                <span className="font-bold text-primary truncate max-w-44 sm:max-w-56">
                  {rule.targetTerm}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                  onClick={() => handleStartEdit(rule)}
                  title="Edit term"
                >
                  <Pencil size={13} />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
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
