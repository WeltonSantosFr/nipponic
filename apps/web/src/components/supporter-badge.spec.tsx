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

  it("renders honorary supporter badge with fallback text when tierName is null", () => {
    render(
      <SupporterBadge
        isSupporter={true}
        isActiveSupporter={false}
      />
    );
    expect(screen.getByText("Honorary Supporter")).toBeInTheDocument();
  });

  it("renders icon only when showText is false", () => {
    const { container: activeContainer } = render(
      <SupporterBadge
        isSupporter={true}
        isActiveSupporter={true}
        showText={false}
        size="md"
      />
    );
    expect(activeContainer.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByText("Active Supporter")).not.toBeInTheDocument();

    const { container: honoraryContainer } = render(
      <SupporterBadge
        isSupporter={true}
        isActiveSupporter={false}
        showText={false}
        size="md"
      />
    );
    expect(honoraryContainer.querySelector("svg")).toBeInTheDocument();
    expect(screen.queryByText("Honorary Supporter")).not.toBeInTheDocument();
  });
});
