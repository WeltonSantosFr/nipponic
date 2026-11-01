import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogPortal,
} from "./dialog";

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "./sheet";

import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "./tooltip";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverClose,
} from "./popover";

import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "./hover-card";

import {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./dropdown-menu";

import {
  Toaster,
  Toast,
  ToastContent,
  ToastTitle,
  ToastDescription,
  ToastAction,
  ToastClose,
  ToastViewport,
  ToastProvider,
  createToastManager,
  useToastManager,
  toast,
} from "./toast";

describe("UI Overlays", () => {
  describe("Dialog", () => {
    it("renders dialog trigger and opens dialog content with title and close button", async () => {
      render(
        <Dialog>
          <DialogTrigger>Open Dialog</DialogTrigger>
          <DialogContent overlayClassName="custom-overlay">
            <DialogHeader>
              <DialogTitle>Modal Title</DialogTitle>
              <DialogDescription>Modal Description</DialogDescription>
            </DialogHeader>
            <p>Modal Body</p>
            <DialogFooter showCloseButton={true}>
              <button>Submit</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const trigger = screen.getByRole("button", { name: "Open Dialog" });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Modal Title")).toBeInTheDocument();
        expect(screen.getByText("Modal Description")).toBeInTheDocument();
        expect(screen.getByText("Modal Body")).toBeInTheDocument();
        expect(screen.getByText("Submit")).toBeInTheDocument();
      });

      const overlay = document.querySelector("[data-slot=dialog-overlay]");
      expect(overlay?.className).toContain("custom-overlay");
    });

    it("supports showCloseButton={false} in DialogContent", async () => {
      render(
        <Dialog defaultOpen>
          <DialogContent showCloseButton={false}>
            <DialogTitle>No X Button</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText("No X Button")).toBeInTheDocument();
      expect(screen.queryByText("Close")).not.toBeInTheDocument();
    });

    it("renders DialogClose and DialogPortal directly", () => {
      render(
        <Dialog defaultOpen>
          <DialogPortal>
            <div>Inside Dialog Portal</div>
            <DialogClose>Dismiss Modal</DialogClose>
          </DialogPortal>
        </Dialog>
      );
      expect(screen.getByText("Inside Dialog Portal")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Dismiss Modal" })).toBeInTheDocument();
    });
  });

  describe("Sheet", () => {
    it("renders SheetTrigger and SheetClose directly", () => {
      render(
        <Sheet defaultOpen>
          <SheetTrigger>Open Sheet</SheetTrigger>
          <SheetClose>Dismiss Sheet</SheetClose>
        </Sheet>
      );
      expect(screen.getByRole("button", { name: "Open Sheet" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Dismiss Sheet" })).toBeInTheDocument();
    });
    it("renders sheet content on specified side", async () => {
      render(
        <Sheet defaultOpen>
          <SheetContent side="left" className="custom-sheet">
            <SheetHeader>
              <SheetTitle>Drawer Title</SheetTitle>
              <SheetDescription>Drawer Description</SheetDescription>
            </SheetHeader>
            <div>Drawer Content</div>
            <SheetFooter>
              <SheetClose>Close Drawer</SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      );

      const content = document.querySelector("[data-slot=sheet-content]");
      expect(content).toBeInTheDocument();
      expect(content).toHaveAttribute("data-side", "left");
      expect(content?.className).toContain("custom-sheet");
      expect(screen.getByText("Drawer Title")).toBeInTheDocument();
      expect(screen.getByText("Drawer Description")).toBeInTheDocument();
      expect(screen.getByText("Drawer Content")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close Drawer" })).toBeInTheDocument();
    });

    it("supports top, bottom, and right side sheets without close button", () => {
      const sides = ["top", "bottom", "right"] as const;
      for (const side of sides) {
        const { unmount } = render(
          <Sheet defaultOpen>
            <SheetContent side={side} showCloseButton={false}>
              <SheetTitle>{side} Sheet</SheetTitle>
            </SheetContent>
          </Sheet>
        );
        const content = document.querySelector("[data-slot=sheet-content]");
        expect(content).toHaveAttribute("data-side", side);
        unmount();
      }
    });
  });

  describe("Tooltip", () => {
    it("renders tooltip trigger within TooltipProvider", () => {
      render(
        <TooltipProvider delay={100}>
          <Tooltip>
            <TooltipTrigger>Hover Target</TooltipTrigger>
            <TooltipContent side="bottom" align="start">
              Tooltip text
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );

      expect(screen.getByRole("button", { name: "Hover Target" })).toBeInTheDocument();
    });
  });

  describe("Popover", () => {
    it("renders popover trigger and content", async () => {
      render(
        <Popover>
          <PopoverTrigger>Toggle Popover</PopoverTrigger>
          <PopoverContent side="top" align="center" className="my-pop">
            <div>Popover Body</div>
            <PopoverClose>Dismiss</PopoverClose>
          </PopoverContent>
        </Popover>
      );

      const trigger = screen.getByRole("button", { name: "Toggle Popover" });
      fireEvent.click(trigger);

      await waitFor(() => {
        expect(screen.getByText("Popover Body")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Dismiss" })).toBeInTheDocument();
      });
    });
  });

  describe("HoverCard", () => {
    it("renders hover card trigger and content", () => {
      render(
        <HoverCard>
          <HoverCardTrigger href="/profile">Profile Preview</HoverCardTrigger>
          <HoverCardContent side="right" align="end" className="custom-hover">
            <div>Preview Details</div>
          </HoverCardContent>
        </HoverCard>
      );

      expect(screen.getByRole("link", { name: "Profile Preview" })).toBeInTheDocument();
    });
  });

  describe("DropdownMenu", () => {
    it("renders dropdown menu with groups, items, checkboxes, radio, separators, and shortcuts", async () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Menu</DropdownMenuTrigger>
          <DropdownMenuContent className="custom-menu">
            <DropdownMenuGroup>
              <DropdownMenuLabel inset>Settings</DropdownMenuLabel>
              <DropdownMenuItem inset>
                Profile
                <DropdownMenuShortcut>⌘P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive">
                Delete Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked={true} inset>
              Show Notifications
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked={false}>
              Dark Mode
            </DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="n5">
              <DropdownMenuRadioItem value="n5" inset>
                JLPT N5
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="n4">
                JLPT N4
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger inset>More Options</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Sub Item 1</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      );

      await waitFor(() => {
        expect(screen.getByText("Settings")).toBeInTheDocument();
        expect(screen.getByText("Profile")).toBeInTheDocument();
        expect(screen.getByText("⌘P")).toBeInTheDocument();
        expect(screen.getByText("Delete Account")).toBeInTheDocument();
        expect(screen.getByText("Show Notifications")).toBeInTheDocument();
        expect(screen.getByText("JLPT N5")).toBeInTheDocument();
        expect(screen.getByText("More Options")).toBeInTheDocument();
      });

      const destItem = screen.getByText("Delete Account").closest("[data-slot=dropdown-menu-item]");
      expect(destItem).toHaveAttribute("data-variant", "destructive");

      const label = screen.getByText("Settings").closest("[data-slot=dropdown-menu-label]");
      expect(label).toHaveAttribute("data-inset", "true");
    });

    it("renders DropdownMenuPortal directly", () => {
      render(
        <DropdownMenu defaultOpen>
          <DropdownMenuPortal>
            <div>Inside Dropdown Portal</div>
          </DropdownMenuPortal>
        </DropdownMenu>
      );
      expect(screen.getByText("Inside Dropdown Portal")).toBeInTheDocument();
    });
  });

  describe("Toast", () => {
    it("renders Toaster and custom toast icons across all supported notification types", async () => {
      const customManager = createToastManager();
      render(<Toaster toastManager={customManager} />);

      const viewport = document.querySelector("[data-slot=toast-viewport]");
      expect(viewport).toBeInTheDocument();

      // Trigger toasts of different types: success, info, warning, error, loading
      React.act(() => {
        customManager.add({
          title: "Success Title",
          description: "Success Description",
          type: "success",
        });
        customManager.add({
          title: "Info Title",
          type: "info",
        });
        customManager.add({
          title: "Warning Title",
          type: "warning",
        });
        customManager.add({
          title: "Error Title",
          type: "error",
        });
        customManager.add({
          title: "Loading Title",
          type: "loading",
        });
        customManager.add({
          title: "Custom Title",
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Success Title")).toBeInTheDocument();
        expect(screen.getByText("Success Description")).toBeInTheDocument();
        expect(screen.getByText("Info Title")).toBeInTheDocument();
        expect(screen.getByText("Warning Title")).toBeInTheDocument();
        expect(screen.getByText("Error Title")).toBeInTheDocument();
        expect(screen.getByText("Loading Title")).toBeInTheDocument();
        expect(screen.getByText("Custom Title")).toBeInTheDocument();
      });

      const icons = document.querySelectorAll("[data-slot=toast-icon]");
      expect(icons.length).toBe(5); // 5 typed toasts have icons
    });

    it("exercises useToastManager and toast singleton", () => {
      function TestComponent() {
        const mgr = useToastManager();
        return (
          <button onClick={() => mgr.add({ title: "Triggered" })}>
            Trigger Toast
          </button>
        );
      }

      render(
        <ToastProvider toastManager={toast}>
          <TestComponent />
        </ToastProvider>
      );

      const btn = screen.getByRole("button", { name: "Trigger Toast" });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
    });
  });
});
