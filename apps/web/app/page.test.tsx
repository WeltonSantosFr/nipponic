import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Home, { maxDuration } from "./page";

vi.mock("@/components/workspace", () => ({
  Workspace: ({ initialNotes }: any) => (
    <div data-testid="mock-workspace">
      <span>Workspace Loaded</span>
      <span>Notes count: {initialNotes?.length}</span>
      <span>First note: {initialNotes?.[0]?.title}</span>
    </div>
  ),
}));

describe("Home Page (app/page.tsx)", () => {
  it("exports maxDuration configuration", () => {
    expect(maxDuration).toBe(60);
  });

  it("renders Workspace with INITIAL_NOTES", () => {
    render(<Home />);

    expect(screen.getByTestId("mock-workspace")).toBeInTheDocument();
    expect(screen.getByText("Workspace Loaded")).toBeInTheDocument();
    expect(screen.getByText("Notes count: 3")).toBeInTheDocument();
    expect(screen.getByText("First note: Today's diary")).toBeInTheDocument();
  });
});
