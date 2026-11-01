import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "./sidebar";
import { TooltipProvider } from "./tooltip";

let mockIsMobile = false;
vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => mockIsMobile,
}));

describe("Sidebar UI Components", () => {
  beforeEach(() => {
    mockIsMobile = false;
    document.cookie = "";
    vi.clearAllMocks();
  });

  describe("useSidebar Hook", () => {
    it("throws an error when used outside of SidebarProvider", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
      expect(() => renderHook(() => useSidebar())).toThrow(
        "useSidebar must be used within a SidebarProvider."
      );
      consoleError.mockRestore();
    });

    it("returns context state and helper functions when inside SidebarProvider", () => {
      const { result } = renderHook(() => useSidebar(), {
        wrapper: ({ children }) => <SidebarProvider>{children}</SidebarProvider>,
      });

      expect(result.current.open).toBe(true);
      expect(result.current.state).toBe("expanded");
      expect(result.current.isMobile).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.open).toBe(false);
      expect(result.current.state).toBe("collapsed");
      expect(document.cookie).toContain("sidebar_state=false");
    });
  });

  describe("SidebarProvider", () => {
    it("supports controlled open state and onOpenChange callback", () => {
      const handleOpenChange = vi.fn();
      const { result } = renderHook(() => useSidebar(), {
        wrapper: ({ children }) => (
          <SidebarProvider open={false} onOpenChange={handleOpenChange}>
            {children}
          </SidebarProvider>
        ),
      });

      expect(result.current.open).toBe(false);
      expect(result.current.state).toBe("collapsed");

      act(() => {
        result.current.setOpen(true);
      });

      expect(handleOpenChange).toHaveBeenCalledWith(true);
      expect(document.cookie).toContain("sidebar_state=true");
    });

    it("toggles mobile open state when isMobile is true", () => {
      mockIsMobile = true;
      const { result } = renderHook(() => useSidebar(), {
        wrapper: ({ children }) => <SidebarProvider>{children}</SidebarProvider>,
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.openMobile).toBe(false);

      act(() => {
        result.current.toggleSidebar();
      });

      expect(result.current.openMobile).toBe(true);

      act(() => {
        result.current.setOpenMobile(false);
      });
      expect(result.current.openMobile).toBe(false);
    });

    it("responds to keyboard shortcut Ctrl/Cmd + b", () => {
      const { result } = renderHook(() => useSidebar(), {
        wrapper: ({ children }) => <SidebarProvider>{children}</SidebarProvider>,
      });

      expect(result.current.open).toBe(true);

      act(() => {
        const event = new KeyboardEvent("keydown", { key: "b", ctrlKey: true });
        window.dispatchEvent(event);
      });

      expect(result.current.open).toBe(false);

      // Meta key (Mac)
      act(() => {
        const event = new KeyboardEvent("keydown", { key: "b", metaKey: true });
        window.dispatchEvent(event);
      });

      expect(result.current.open).toBe(true);
    });
  });

  describe("Sidebar Desktop and Variants", () => {
    it("renders desktop sidebar with default collapsible offcanvas and variant sidebar", () => {
      render(
        <SidebarProvider defaultOpen={true}>
          <Sidebar side="left" variant="sidebar" collapsible="offcanvas" className="custom-sb">
            <SidebarHeader>Header</SidebarHeader>
            <SidebarContent>Content</SidebarContent>
            <SidebarFooter>Footer</SidebarFooter>
          </Sidebar>
        </SidebarProvider>
      );

      const sidebar = document.querySelector("[data-slot=sidebar][data-state=expanded]");
      expect(sidebar).toBeInTheDocument();
      expect(sidebar).toHaveAttribute("data-side", "left");
      expect(sidebar).toHaveAttribute("data-variant", "sidebar");
      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("renders collapsible none as fixed sidebar", () => {
      render(
        <SidebarProvider>
          <Sidebar collapsible="none" className="none-collapsible">
            <div>Fixed Nav</div>
          </Sidebar>
        </SidebarProvider>
      );

      const fixedSidebar = screen.getByText("Fixed Nav").closest("[data-slot=sidebar]");
      expect(fixedSidebar).toBeInTheDocument();
      expect(fixedSidebar?.className).toContain("none-collapsible");
    });

    it("renders floating and inset variants with right side", () => {
      const { unmount } = render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar side="right" variant="floating" collapsible="icon">
            <div>Floating Nav</div>
          </Sidebar>
        </SidebarProvider>
      );

      const floating = document.querySelector("[data-slot=sidebar]");
      expect(floating).toHaveAttribute("data-variant", "floating");
      expect(floating).toHaveAttribute("data-side", "right");
      expect(floating).toHaveAttribute("data-collapsible", "icon");
      unmount();

      render(
        <SidebarProvider defaultOpen={false}>
          <Sidebar variant="inset" collapsible="icon">
            <div>Inset Nav</div>
          </Sidebar>
        </SidebarProvider>
      );
      const inset = document.querySelector("[data-slot=sidebar]");
      expect(inset).toHaveAttribute("data-variant", "inset");
    });
  });

  describe("Sidebar Mobile Mode", () => {
    it("renders mobile Sheet when isMobile is true and can be toggled", () => {
      mockIsMobile = true;
      render(
        <SidebarProvider>
          <SidebarTrigger data-testid="sidebar-trigger" />
          <Sidebar>
            <div>Mobile Items</div>
          </Sidebar>
        </SidebarProvider>
      );

      const trigger = screen.getByTestId("sidebar-trigger");
      expect(trigger).toBeInTheDocument();

      // Click trigger to open mobile sheet
      fireEvent.click(trigger);

      expect(screen.getByText("Mobile Items")).toBeInTheDocument();
      expect(screen.getByText("Sidebar")).toBeInTheDocument(); // SheetTitle sr-only
    });
  });

  describe("Sidebar Subcomponents", () => {
    it("renders SidebarTrigger with custom onClick handler", () => {
      const customClick = vi.fn();
      render(
        <SidebarProvider>
          <SidebarTrigger onClick={customClick} className="my-trigger" />
        </SidebarProvider>
      );

      const btn = document.querySelector(".my-trigger") as HTMLButtonElement;
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(customClick).toHaveBeenCalledTimes(1);
    });

    it("renders SidebarRail and handles rail click to toggle", () => {
      render(
        <SidebarProvider>
          <SidebarRail className="my-rail" />
        </SidebarProvider>
      );

      const rail = document.querySelector("[data-slot=sidebar-rail]") as HTMLButtonElement;
      expect(rail).toBeInTheDocument();
      expect(rail.className).toContain("my-rail");
      fireEvent.click(rail);
    });

    it("renders SidebarInset, SidebarInput, and SidebarSeparator", () => {
      render(
        <SidebarProvider>
          <SidebarInset className="my-inset">
            <SidebarInput placeholder="Search nav..." className="my-input" />
            <SidebarSeparator className="my-sep" />
          </SidebarInset>
        </SidebarProvider>
      );

      const inset = document.querySelector("[data-slot=sidebar-inset]");
      expect(inset).toBeInTheDocument();
      expect(inset?.className).toContain("my-inset");

      const input = screen.getByPlaceholderText("Search nav...");
      expect(input).toHaveAttribute("data-slot", "sidebar-input");

      const sep = document.querySelector("[data-slot=sidebar-separator]");
      expect(sep).toBeInTheDocument();
    });

    it("renders SidebarGroup, SidebarGroupLabel, SidebarGroupAction, and SidebarGroupContent", () => {
      render(
        <SidebarProvider>
          <SidebarGroup className="my-group">
            <SidebarGroupLabel className="my-label">Navigation</SidebarGroupLabel>
            <SidebarGroupAction title="Add Item" className="my-action">
              <span>+</span>
            </SidebarGroupAction>
            <SidebarGroupContent className="my-group-content">
              <span>Group Items</span>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarProvider>
      );

      expect(screen.getByText("Navigation")).toHaveAttribute("data-slot", "sidebar-group-label");
      expect(screen.getByTitle("Add Item")).toHaveAttribute("data-slot", "sidebar-group-action");
      expect(screen.getByText("Group Items")).toBeInTheDocument();
    });

    it("renders SidebarMenu, MenuItem, MenuButton (variants, sizes, isActive, tooltip), and MenuBadge", () => {
      render(
        <TooltipProvider>
          <SidebarProvider defaultOpen={false}>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={true}
                  variant="outline"
                  size="sm"
                  tooltip="Dashboard Tooltip"
                  className="my-btn"
                >
                  Dashboard
                </SidebarMenuButton>
                <SidebarMenuAction showOnHover className="my-menu-action">
                  <span>Action</span>
                </SidebarMenuAction>
                <SidebarMenuBadge>New</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  variant="default"
                  size="lg"
                  tooltip={{ children: "Custom Object Tooltip", side: "right" }}
                >
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>Simple No Tooltip</SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarProvider>
        </TooltipProvider>
      );

      const dashboardBtn = screen.getByText("Dashboard").closest("[data-slot=sidebar-menu-button]");
      expect(dashboardBtn).toHaveAttribute("data-active");
      expect(dashboardBtn).toHaveAttribute("data-size", "sm");

      const action = screen.getByText("Action").closest("[data-slot=sidebar-menu-action]");
      expect(action?.className).toContain("md:opacity-0");

      expect(screen.getByText("New")).toHaveAttribute("data-slot", "sidebar-menu-badge");
      expect(screen.getByText("Settings")).toBeInTheDocument();
    });

    it("renders SidebarMenuSkeleton with showIcon true and false", () => {
      const { unmount } = render(
        <SidebarMenuSkeleton showIcon={true} className="my-skel" />
      );
      const skel = document.querySelector("[data-slot=sidebar-menu-skeleton]");
      expect(skel).toBeInTheDocument();
      expect(skel?.className).toContain("my-skel");
      const icon = document.querySelector("[data-sidebar=menu-skeleton-icon]");
      expect(icon).toBeInTheDocument();
      unmount();

      render(<SidebarMenuSkeleton showIcon={false} />);
      expect(document.querySelector("[data-sidebar=menu-skeleton-icon]")).toBeNull();
    });

    it("renders SidebarMenuSub, SubItem, and SubButton with sizes and isActive", () => {
      render(
        <SidebarMenuSub className="my-sub">
          <SidebarMenuSubItem>
            <SidebarMenuSubButton size="sm" isActive={true} className="my-sub-btn">
              Sub Link 1
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
          <SidebarMenuSubItem>
            <SidebarMenuSubButton size="md">
              Sub Link 2
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        </SidebarMenuSub>
      );

      const sub1 = screen.getByText("Sub Link 1").closest("[data-slot=sidebar-menu-sub-button]");
      expect(sub1).toHaveAttribute("data-size", "sm");
      expect(sub1).toHaveAttribute("data-active");

      const sub2 = screen.getByText("Sub Link 2").closest("[data-slot=sidebar-menu-sub-button]");
      expect(sub2).toHaveAttribute("data-size", "md");
    });
  });
});
