import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InteractiveExercise } from "./interactive-exercise";
import type { LessonExercise } from "@nipponic/shared";

describe("InteractiveExercise", () => {
  it("renders multiple choice exercise and handles correct answer", () => {
    const exercise: LessonExercise = {
      id: "ex_1",
      order: 1,
      type: "multiple_choice",
      prompt: "Choose the polite copula:",
      options: ["です", "ます", "だ"],
      correctAnswer: "です",
      explanation: "です is the polite copula.",
    };

    const onAnswer = vi.fn();
    const { rerender } = render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={onAnswer}
        isAnswered={false}
      />
    );

    expect(screen.getByText("Choose the polite copula:")).toBeDefined();
    const correctBtn = screen.getByText("です");
    fireEvent.click(correctBtn);

    expect(onAnswer).toHaveBeenCalledWith(true);

    // Re-render as answered
    rerender(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={onAnswer}
        isAnswered={true}
        wasCorrect={true}
      />
    );

    expect(screen.getByText("Correct")).toBeDefined();
    expect(screen.getByText("です is the polite copula.")).toBeDefined();
  });

  it("handles incorrect answer in multiple choice and shows explanation", () => {
    const exercise: LessonExercise = {
      id: "ex_1",
      order: 1,
      type: "multiple_choice",
      prompt: "Choose the polite copula:",
      options: ["です", "ます", "だ"],
      correctAnswer: "です",
      explanation: "です is the polite copula.",
    };

    const onAnswer = vi.fn();
    render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={onAnswer}
        isAnswered={true}
        wasCorrect={false}
      />
    );

    expect(screen.getByText("Incorrect")).toBeDefined();
    expect(screen.getByText("です is the polite copula.")).toBeDefined();
    expect(screen.getByText("です", { selector: "span.font-bold.underline" })).toBeDefined();
  });

  it("handles fill in the blank exercise", () => {
    const exercise: LessonExercise = {
      id: "ex_2",
      order: 2,
      type: "fill_blank",
      prompt: "Fill in the blank: 学生____ (is a student)",
      correctAnswer: "です",
      explanation: "です completes the sentence politely.",
    };

    const onAnswer = vi.fn();
    render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={onAnswer}
        isAnswered={false}
      />
    );

    const input = screen.getByPlaceholderText("Type your answer here...");
    fireEvent.change(input, { target: { value: "です" } });

    const checkBtn = screen.getByText("Check Answer");
    fireEvent.click(checkBtn);

    expect(onAnswer).toHaveBeenCalledWith(true);
  });

  it("handles sentence reorder exercise by tapping chips", () => {
    const exercise: LessonExercise = {
      id: "ex_3",
      order: 3,
      type: "reorder",
      prompt: "Arrange the words to say: 'I am Tanaka.'",
      options: ["田中", "です。", "私は"],
      correctAnswer: "私は 田中 です。",
      explanation: "Standard Japanese topic-predicate order.",
    };

    const onAnswer = vi.fn();
    render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={onAnswer}
        isAnswered={false}
      />
    );

    // Tap chips in order: 私は -> 田中 -> です。
    fireEvent.click(screen.getByText("私は"));
    fireEvent.click(screen.getByText("田中"));
    fireEvent.click(screen.getByText("です。"));

    const checkOrderBtn = screen.getByText("Check Order");
    fireEvent.click(checkOrderBtn);

    expect(onAnswer).toHaveBeenCalledWith(true);
  });
});
