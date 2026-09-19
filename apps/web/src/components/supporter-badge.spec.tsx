import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SupporterBadge } from "./supporter-badge";

describe("SupporterBadge", () => {
  it("renders nothing when isSupporter is false or undefined", () => {
    const { container } = render(<SupporterBadge isSupporter={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders active supporter badge with default text", () => {
    render(<SupporterBadge isSupporter={true} isActiveSupporter={true} />);
    expect(screen.getByText("Active Supporter")).toBeInTheDocument();
  });

  it("renders custom tier name when provided", () => {
    render(
      <SupporterBadge
        isSupporter={true}
        isActiveSupporter={true}
        tierName="🍜 Ramen"
      />
    );
    expect(screen.getByText("🍜 Ramen")).toBeInTheDocument();
  });

  it("renders commemorative badge for past supporters", () => {
    render(
      <SupporterBadge
        isSupporter={true}
        isActiveSupporter={false}
        tierName="🍱 Bento"
      />
    );
    expect(screen.getByText("🍱 Bento (Honorary)")).toBeInTheDocument();
  });
});
