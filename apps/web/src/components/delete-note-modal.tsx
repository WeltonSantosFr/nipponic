import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Note } from "@nipponic/shared";
import { Trash2 } from "lucide-react";

interface DeleteNoteModalProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteNoteModal({
  note,
  isOpen,
  onClose,
  onConfirm,
}: DeleteNoteModalProps) {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5 text-red-500" />
            <DialogTitle>Delete Note</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">
              "{note.title || "Untitled Note"}"
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 size={16} />
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
