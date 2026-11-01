import * as React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { GlossaryModal } from "./glossary-modal";

let currentRules = [
  { id: "rule-1", sourceTerm: "coffee", targetTerm: "珈琲", createdAt: "2026-10-01" },
];
const mockAddRule = vi.fn();
const mockRemoveRule = vi.fn();

vi.mock("@/services/glossary", () => ({
  useGlossaryRules: () => ({
    rules: currentRules,
    addRule: mockAddRule,
    removeRule: mockRemoveRule,
  }),
}));

describe("GlossaryModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentRules = [
      { id: "rule-1", sourceTerm: "coffee", targetTerm: "珈琲", createdAt: "2026-10-01" },
    ];
  });

  it("renders modal with initial rules and initial terms", () => {
    const handleClose = vi.fn();
    render(
      <GlossaryModal
        isOpen={true}
        onClose={handleClose}
        initialSourceTerm="train"
        initialTargetTerm="電車"
      />
    );

    expect(screen.getByText("Custom Translation Glossary")).toBeInTheDocument();
    expect(screen.getByDisplayValue("train")).toBeInTheDocument();
    expect(screen.getByDisplayValue("電車")).toBeInTheDocument();

    expect(screen.getByText("coffee")).toBeInTheDocument();
    expect(screen.getByText("珈琲")).toBeInTheDocument();
  });

  it("submits form and calls addRule with entered terms", () => {
    render(
      <GlossaryModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const sourceInput = screen.getByPlaceholderText("e.g. coffee shop");
    const targetInput = screen.getByPlaceholderText("e.g. 喫茶店");
    const submitBtn = screen.getByRole("button", { name: "Save Rule" });

    expect(submitBtn).toBeDisabled();

    fireEvent.change(sourceInput, { target: { value: "book" } });
    fireEvent.change(targetInput, { target: { value: "本" } });

    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    expect(mockAddRule).toHaveBeenCalledWith("book", "本");
    expect(sourceInput).toHaveValue("");
    expect(targetInput).toHaveValue("");
  });

  it("calls removeRule when deleting a rule", () => {
    render(
      <GlossaryModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const deleteBtn = screen.getByTitle("Delete rule");
    fireEvent.click(deleteBtn);

    expect(mockRemoveRule).toHaveBeenCalledWith("rule-1");
  });

  it("renders empty state notice when no rules are registered", () => {
    currentRules = [];

    render(
      <GlossaryModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(
      screen.getByText(/No rules registered yet\. Add terms above/i)
    ).toBeInTheDocument();
  });

  it("handles form submission with blank inputs gracefully without calling addRule", () => {
    render(
      <GlossaryModal
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    const form = screen.getByRole("button", { name: "Save Rule" }).closest("form");
    if (form) {
      fireEvent.submit(form);
    }
    expect(mockAddRule).not.toHaveBeenCalled();
  });

  it("closes modal on escape key press", () => {
    const handleClose = vi.fn();
    render(
      <GlossaryModal
        isOpen={true}
        onClose={handleClose}
      />
    );

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape", code: "Escape" });
    expect(handleClose).toHaveBeenCalled();
  });
});
