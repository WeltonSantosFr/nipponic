import * as React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { Badge, badgeVariants } from "./badge";
import { Button, buttonVariants } from "./button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "./card";
import { Input } from "./input";
import { Label } from "./label";
import { Separator } from "./separator";
import { Skeleton } from "./skeleton";
import { Textarea } from "./textarea";
import { Toggle, toggleVariants } from "./toggle";
import { ToggleGroup, ToggleGroupItem } from "./toggle-group";
import { ScrollArea, ScrollBar } from "./scroll-area";

describe("UI Primitives", () => {
  describe("Badge", () => {
    it("renders default badge with correct classes", () => {
      render(<Badge>Default Badge</Badge>);
      const badge = screen.getByText("Default Badge");
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain("bg-primary");
    });

    it("renders all badge variants properly", () => {
      const variants = [
        { variant: "secondary", expected: "bg-secondary" },
        { variant: "destructive", expected: "text-destructive" },
        { variant: "outline", expected: "border-border" },
        { variant: "ghost", expected: "hover:bg-muted" },
        { variant: "link", expected: "text-primary underline-offset-4" },
      ] as const;

      for (const { variant, expected } of variants) {
        const { unmount } = render(<Badge variant={variant}>{variant}</Badge>);
        const el = screen.getByText(variant);
        expect(el.className).toContain(expected);
        unmount();
      }
    });

    it("supports custom className and custom render tag", () => {
      render(
        <Badge className="custom-badge-cls" render={<a href="/test" />}>
          Link Badge
        </Badge>
      );
      const linkBadge = screen.getByRole("link", { name: "Link Badge" });
      expect(linkBadge).toBeInTheDocument();
      expect(linkBadge.className).toContain("custom-badge-cls");
    });

    it("generates standalone badge variants classes via badgeVariants", () => {
      const cls = badgeVariants({ variant: "destructive" });
      expect(cls).toContain("text-destructive");
    });
  });

  describe("Button", () => {
    it("renders default button and handles click", () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);
      const btn = screen.getByRole("button", { name: "Click Me" });
      expect(btn).toBeInTheDocument();
      expect(btn.className).toContain("bg-primary");

      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("renders all button variants properly", () => {
      const variants = [
        { variant: "outline", expected: "border-border" },
        { variant: "secondary", expected: "bg-secondary" },
        { variant: "ghost", expected: "hover:bg-muted" },
        { variant: "destructive", expected: "text-destructive" },
        { variant: "link", expected: "hover:underline" },
      ] as const;

      for (const { variant, expected } of variants) {
        const { unmount } = render(<Button variant={variant}>{variant}</Button>);
        const btn = screen.getByRole("button", { name: variant });
        expect(btn.className).toContain(expected);
        unmount();
      }
    });

    it("renders all button sizes properly", () => {
      const sizes = [
        { size: "xs", expected: "h-6" },
        { size: "sm", expected: "h-8" },
        { size: "lg", expected: "h-10" },
        { size: "icon", expected: "size-9" },
        { size: "icon-xs", expected: "size-6" },
        { size: "icon-sm", expected: "size-8" },
        { size: "icon-lg", expected: "size-10" },
      ] as const;

      for (const { size, expected } of sizes) {
        const { unmount } = render(<Button size={size}>Size {size}</Button>);
        const btn = screen.getByRole("button", { name: `Size ${size}` });
        expect(btn.className).toContain(expected);
        unmount();
      }
    });

    it("supports disabled state", () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      const btn = screen.getByRole("button", { name: "Disabled" });
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it("generates standalone buttonVariants classes", () => {
      const cls = buttonVariants({ variant: "destructive", size: "lg" });
      expect(cls).toContain("h-10");
      expect(cls).toContain("text-destructive");
    });
  });

  describe("Card", () => {
    it("renders card hierarchy with all subcomponents", () => {
      render(
        <Card size="sm" className="my-card">
          <CardHeader className="my-header">
            <CardTitle className="my-title">Card Title</CardTitle>
            <CardDescription className="my-desc">Card Description</CardDescription>
            <CardAction className="my-action">
              <button>Action</button>
            </CardAction>
          </CardHeader>
          <CardContent className="my-content">
            <p>Content Body</p>
          </CardContent>
          <CardFooter className="my-footer">
            Footer Note
          </CardFooter>
        </Card>
      );

      const card = screen.getByText("Card Title").closest("[data-slot=card]");
      expect(card).toBeInTheDocument();
      expect(card).toHaveAttribute("data-size", "sm");
      expect(card?.className).toContain("my-card");

      expect(screen.getByText("Card Description")).toHaveAttribute("data-slot", "card-description");
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("Content Body")).toBeInTheDocument();
      expect(screen.getByText("Footer Note")).toHaveAttribute("data-slot", "card-footer");
    });

    it("renders default size card", () => {
      render(
        <Card data-testid="default-card">
          <CardContent>Body</CardContent>
        </Card>
      );
      const card = screen.getByTestId("default-card");
      expect(card).toHaveAttribute("data-size", "default");
    });
  });

  describe("Input", () => {
    it("renders input field and accepts user input", () => {
      const handleChange = vi.fn();
      render(
        <Input
          type="text"
          placeholder="Enter text..."
          onChange={handleChange}
          aria-invalid={true}
        />
      );

      const input = screen.getByPlaceholderText("Enter text...") as HTMLInputElement;
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("data-slot", "input");
      expect(input).toHaveAttribute("aria-invalid", "true");

      fireEvent.change(input, { target: { value: "Hello" } });
      expect(handleChange).toHaveBeenCalled();
    });

    it("renders disabled input", () => {
      render(<Input disabled placeholder="Disabled input" />);
      const input = screen.getByPlaceholderText("Disabled input");
      expect(input).toBeDisabled();
    });
  });

  describe("Label", () => {
    it("renders label element with children and htmlFor attribute", () => {
      render(
        <Label htmlFor="test-id" className="custom-label">
          Test Label
        </Label>
      );

      const label = screen.getByText("Test Label");
      expect(label).toBeInTheDocument();
      expect(label).toHaveAttribute("data-slot", "label");
      expect(label).toHaveAttribute("for", "test-id");
      expect(label.className).toContain("custom-label");
    });
  });

  describe("Separator", () => {
    it("renders horizontal separator by default", () => {
      render(<Separator data-testid="sep-h" />);
      const sep = screen.getByTestId("sep-h");
      expect(sep).toBeInTheDocument();
      expect(sep).toHaveAttribute("data-slot", "separator");
      expect(sep).toHaveAttribute("data-orientation", "horizontal");
    });

    it("renders vertical separator with custom className", () => {
      render(<Separator orientation="vertical" className="custom-sep" data-testid="sep-v" />);
      const sep = screen.getByTestId("sep-v");
      expect(sep).toHaveAttribute("data-orientation", "vertical");
      expect(sep.className).toContain("custom-sep");
    });
  });

  describe("Skeleton", () => {
    it("renders skeleton placeholder div with pulse animation", () => {
      render(<Skeleton className="size-12 rounded-full" data-testid="skel" />);
      const skel = screen.getByTestId("skel");
      expect(skel).toBeInTheDocument();
      expect(skel).toHaveAttribute("data-slot", "skeleton");
      expect(skel.className).toContain("animate-pulse");
      expect(skel.className).toContain("size-12");
    });
  });

  describe("Textarea", () => {
    it("renders textarea element and handles text entry", () => {
      const handleChange = vi.fn();
      render(
        <Textarea
          placeholder="Notes here..."
          onChange={handleChange}
          className="custom-textarea"
        />
      );

      const textarea = screen.getByPlaceholderText("Notes here...");
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute("data-slot", "textarea");
      expect(textarea.className).toContain("custom-textarea");

      fireEvent.change(textarea, { target: { value: "New note line" } });
      expect(handleChange).toHaveBeenCalled();
    });
  });

  describe("Toggle", () => {
    it("renders default toggle and handles click", () => {
      render(<Toggle aria-label="Toggle Bold">B</Toggle>);
      const toggle = screen.getByRole("button", { name: "Toggle Bold" });
      expect(toggle).toBeInTheDocument();
      expect(toggle).toHaveAttribute("data-slot", "toggle");
      expect(toggle.className).toContain("bg-transparent");
    });

    it("renders outline variant and different sizes", () => {
      render(
        <Toggle variant="outline" size="lg" aria-label="Toggle Outline">
          Outline
        </Toggle>
      );
      const toggle = screen.getByRole("button", { name: "Toggle Outline" });
      expect(toggle.className).toContain("border-input");
      expect(toggle.className).toContain("h-10");
    });

    it("generates standalone toggleVariants", () => {
      const cls = toggleVariants({ variant: "outline", size: "sm" });
      expect(cls).toContain("border-input");
      expect(cls).toContain("h-8");
    });
  });

  describe("ToggleGroup", () => {
    it("renders toggle group and propagates context to items", () => {
      render(
        <ToggleGroup variant="outline" size="sm" spacing={0} orientation="vertical">
          <ToggleGroupItem value="a" aria-label="Item A">A</ToggleGroupItem>
          <ToggleGroupItem value="b" aria-label="Item B">B</ToggleGroupItem>
        </ToggleGroup>
      );

      const itemA = screen.getByRole("button", { name: "Item A" });
      const itemB = screen.getByRole("button", { name: "Item B" });
      expect(itemA).toBeInTheDocument();
      expect(itemB).toBeInTheDocument();
      expect(itemA).toHaveAttribute("data-slot", "toggle-group-item");
      expect(itemA).toHaveAttribute("data-variant", "outline");
      expect(itemA).toHaveAttribute("data-size", "sm");
      expect(itemA).toHaveAttribute("data-spacing", "0");
    });

    it("renders horizontal toggle group with default spacing", () => {
      render(
        <ToggleGroup>
          <ToggleGroupItem value="1" aria-label="One">1</ToggleGroupItem>
        </ToggleGroup>
      );
      const item = screen.getByRole("button", { name: "One" });
      expect(item).toBeInTheDocument();
    });
  });

  describe("ScrollArea", () => {
    it("renders scroll area with viewport and scrollbars", () => {
      render(
        <ScrollArea className="h-64 w-48">
          <div>Scrollable content here</div>
        </ScrollArea>
      );

      expect(screen.getByText("Scrollable content here")).toBeInTheDocument();
      const scrollArea = screen.getByText("Scrollable content here").closest("[data-slot=scroll-area]");
      expect(scrollArea).toBeInTheDocument();
    });

    it("renders standalone ScrollBar with custom orientation", () => {
      render(
        <ScrollArea>
          <ScrollBar keepMounted orientation="horizontal" className="custom-sb" />
        </ScrollArea>
      );
      const sb = document.querySelector("[data-slot=scroll-area-scrollbar][data-orientation=horizontal]");
      expect(sb).toBeInTheDocument();
      expect(sb?.className).toContain("custom-sb");
    });
  });
});
