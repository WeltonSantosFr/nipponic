"use client";

import { Deck } from "@nipponic/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface DeleteDeckModalProps {
  deck: Deck | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteDeckModal({
  deck,
  isOpen,
  onClose,
  onConfirm,
}: DeleteDeckModalProps) {
  if (!deck) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive mb-2">
            <Trash2 size={20} />
            <DialogTitle>Delete Deck</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete &quot;
            <span className="font-semibold text-foreground">{deck.name}</span>&quot;?
            Your cards in this deck will not be deleted from your arsenal. This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="cursor-pointer"
          >
            Delete Deck
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
