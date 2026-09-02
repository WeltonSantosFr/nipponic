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
import { useGlossaryRules } from "@/services/glossary";
import { BookMarked, Plus, Trash2 } from "lucide-react";

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSourceTerm?: string;
  initialTargetTerm?: string;
}

export function GlossaryModal({
  isOpen,
  onClose,
  initialSourceTerm = "",
  initialTargetTerm = "",
}: GlossaryModalProps) {
  const { rules, addRule, removeRule } = useGlossaryRules();
  const [sourceTerm, setSourceTerm] = useState(initialSourceTerm);
  const [targetTerm, setTargetTerm] = useState(initialTargetTerm);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceTerm.trim() || !targetTerm.trim()) return;

    addRule(sourceTerm, targetTerm);
    setSourceTerm("");
    setTargetTerm("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col gap-5 overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <BookMarked className="h-5 w-5" />
            <DialogTitle>Custom Translation Glossary</DialogTitle>
          </div>
          <DialogDescription>
            Define English words or phrases that should always be translated with
            your preferred Japanese vocabulary or kanji.
          </DialogDescription>
        </DialogHeader>

        {/* Form to add a new rule */}
        <form
          onSubmit={handleSubmit}
          className="p-4 bg-muted/40 rounded-lg border flex flex-col gap-3"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="source-term" className="text-xs">
                English Term
              </Label>
              <Input
                id="source-term"
                placeholder="e.g. coffee shop"
                value={sourceTerm}
                onChange={(e) => setSourceTerm(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="target-term" className="text-xs">
                Preferred Japanese
              </Label>
              <Input
                id="target-term"
                placeholder="e.g. 喫茶店"
                value={targetTerm}
                onChange={(e) => setTargetTerm(e.target.value)}
                required
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            className="self-end gap-1.5"
            disabled={!sourceTerm.trim() || !targetTerm.trim()}
          >
            <Plus size={16} />
            Save Rule
          </Button>
        </form>

        {/* List of active rules */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-64 pr-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Active Rules ({rules.length})
          </p>

          {rules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm border border-dashed rounded-md">
              No rules registered yet. Add terms above so the app remembers your
              custom translations.
            </div>
          ) : (
            rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-md border bg-card text-card-foreground text-sm hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="font-medium truncate max-w-40">
                    {rule.sourceTerm}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span className="font-bold text-primary truncate max-w-44">
                    {rule.targetTerm}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  onClick={() => removeRule(rule.id)}
                  title="Delete rule"
                >
                  <Trash2 size={14} />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
