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
    const { container, rerender } = render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={onAnswer}
        isAnswered={false}
      />
    );

    // Click incorrect option
    const wrongBtn = screen.getByText("だ");
    fireEvent.click(wrongBtn);
    expect(onAnswer).toHaveBeenCalledWith(false);

    // Re-render as answered with incorrect state
    rerender(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={onAnswer}
        isAnswered={true}
        wasCorrect={false}
      />
    );

    expect(screen.getByText("Incorrect")).toBeDefined();
    expect(screen.getByText("です is the polite copula.")).toBeDefined();
    expect(container.querySelector("span.font-bold.underline")).toHaveTextContent("です");
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

  it("renders options with ruby furigana when markdown ruby notation is provided", () => {
    const exercise: LessonExercise = {
      id: "ex_4",
      order: 4,
      type: "multiple_choice",
      prompt: "Select the formal expression:",
      options: ["{極|きわ}まりない", "簡単です"],
      correctAnswer: "{極|きわ}まりない",
      explanation: "極まりない is high literary register.",
    };

    const { container } = render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={vi.fn()}
        isAnswered={false}
        showFurigana={true}
      />
    );

    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby).toHaveTextContent("きわ");
    expect(ruby).toHaveTextContent("極");
  });

  it("applies responsive mobile classes for 320px viewport compatibility", () => {
    const exercise: LessonExercise = {
      id: "ex_responsive",
      order: 1,
      type: "fill_blank",
      prompt: "Responsive test prompt",
      correctAnswer: "test",
      explanation: "Test explanation",
    };

    const { container } = render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={vi.fn()}
        isAnswered={false}
      />
    );

    const rootCard = container.firstElementChild as HTMLElement;
    expect(rootCard.className).toContain("p-3.5 sm:p-5");
    expect(rootCard.className).toContain("min-w-0");
    expect(rootCard.className).toContain("max-w-full");

    const form = container.querySelector("form");
    expect(form?.className).toContain("flex-col sm:flex-row");
  });

  it("applies whitespace-normal and break-words on interactive exercise buttons to prevent 320px blowout", () => {
    const mcExercise: LessonExercise = {
      id: "ex_mc_wrap",
      order: 1,
      type: "multiple_choice",
      prompt: "Select answer",
      options: ["Very long option that needs to wrap properly without overflowing on 320px viewports"],
      correctAnswer: "Very long option that needs to wrap properly without overflowing on 320px viewports",
      explanation: "Test",
    };

    const { container, rerender } = render(
      <InteractiveExercise
        exercise={mcExercise}
        onAnswer={vi.fn()}
        isAnswered={false}
      />
    );

    const mcBtn = screen.getByRole("button", { name: /Very long option/i });
    expect(mcBtn.className).toContain("whitespace-normal");
    expect(mcBtn.className).toContain("break-words");

    // Reorder exercise chips & buttons
    const reorderExercise: LessonExercise = {
      id: "ex_reorder_wrap",
      order: 2,
      type: "reorder",
      prompt: "Reorder test",
      options: ["WordA", "WordB"],
      correctAnswer: "WordA WordB",
      explanation: "Reorder explanation",
    };

    render(
      <InteractiveExercise
        exercise={reorderExercise}
        onAnswer={vi.fn()}
        isAnswered={false}
      />
    );

    const chipA = screen.getByRole("button", { name: "WordA" });
    expect(chipA.className).toContain("break-words");
    expect(chipA.className).toContain("max-w-full");

    const checkOrderBtn = screen.getByRole("button", { name: "Check Order" });
    expect(checkOrderBtn.className).toContain("whitespace-normal");
    expect(checkOrderBtn.className).toContain("break-words");
  });

  it("handles resetting and removing chips in reorder exercise", () => {
    const exercise: LessonExercise = {
      id: "ex_chips",
      order: 1,
      type: "reorder",
      prompt: "Reorder test",
      options: ["Word1", "Word2"],
      correctAnswer: "Word1 Word2",
      explanation: "Test",
    };

    render(
      <InteractiveExercise
        exercise={exercise}
        onAnswer={vi.fn()}
        isAnswered={false}
      />
    );

    // Tap Word1
    fireEvent.click(screen.getByRole("button", { name: "Word1" }));
    expect(screen.getByTitle("Click to remove")).toBeInTheDocument();

    // Remove chip by clicking it in the construction zone
    fireEvent.click(screen.getByTitle("Click to remove"));
    expect(screen.queryByTitle("Click to remove")).toBeNull();

    // Tap Word1 again and test Reset button
    fireEvent.click(screen.getByRole("button", { name: "Word1" }));
    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    fireEvent.click(resetBtn);
    expect(screen.queryByTitle("Click to remove")).toBeNull();
  });

  it("handles incorrect answer submission in fill in blank and reorder exercises", () => {
    const fillBlankEx: LessonExercise = {
      id: "ex_fb_wrong",
      order: 1,
      type: "fill_blank",
      prompt: "Fill blank",
      correctAnswer: "right",
      explanation: "Explanation",
    };

    const onAnswerFb = vi.fn();
    render(
      <InteractiveExercise
        exercise={fillBlankEx}
        onAnswer={onAnswerFb}
        isAnswered={false}
      />
    );

    fireEvent.change(screen.getByPlaceholderText("Type your answer here..."), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByText("Check Answer"));
    expect(onAnswerFb).toHaveBeenCalledWith(false);

    // Reorder wrong answer
    const reorderEx: LessonExercise = {
      id: "ex_reorder_wrong",
      order: 2,
      type: "reorder",
      prompt: "Reorder",
      options: ["B", "A"],
      correctAnswer: "A B",
      explanation: "Explanation",
    };

    const onAnswerReorder = vi.fn();
    render(
      <InteractiveExercise
        exercise={reorderEx}
        onAnswer={onAnswerReorder}
        isAnswered={false}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "B" }));
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByText("Check Order"));
    expect(onAnswerReorder).toHaveBeenCalledWith(false);
  });

  it("guards against empty input and empty chips submission", () => {
    const onAnswer = vi.fn();
    const fillEx: LessonExercise = {
      id: "ex_fill_blank",
      order: 1,
      type: "fill_blank",
      prompt: "Prompt",
      correctAnswer: "ans",
      explanation: "Test explanation",
    };

    render(<InteractiveExercise exercise={fillEx} onAnswer={onAnswer} isAnswered={false} />);
    fireEvent.click(screen.getByText("Check Answer"));
    expect(onAnswer).not.toHaveBeenCalled();

    const reorderEx: LessonExercise = {
      id: "ex_reorder_empty",
      order: 2,
      type: "reorder",
      prompt: "Reorder",
      options: ["A"],
      correctAnswer: "A",
      explanation: "Test explanation",
    };
    render(<InteractiveExercise exercise={reorderEx} onAnswer={onAnswer} isAnswered={false} />);
    fireEvent.click(screen.getByText("Check Order"));
    expect(onAnswer).not.toHaveBeenCalled();
  });

  it("resets selected chips back to available chips using Reset button", () => {
    const onAnswer = vi.fn();
    const exercise: LessonExercise = {
      id: "ex_reorder_reset",
      order: 1,
      type: "reorder",
      prompt: "Arrange chips",
      options: ["A", "B", "C"],
      correctAnswer: "A B C",
      explanation: "Test explanation",
    };

    render(<InteractiveExercise exercise={exercise} onAnswer={onAnswer} isAnswered={false} />);

    // Select chip A and B
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    fireEvent.click(screen.getByRole("button", { name: "B" }));

    // Reset button is now enabled
    const resetBtn = screen.getByRole("button", { name: /Reset/i });
    expect(resetBtn).not.toBeDisabled();

    fireEvent.click(resetBtn);

    // After reset, all chips are back in available list
    expect(screen.getByRole("button", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "B" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "C" })).toBeInTheDocument();
    expect(resetBtn).toBeDisabled();
  });

  it("handles reorder without options and guarded operations when already answered", () => {
    const onAnswer = vi.fn();
    const reorderNoOptions: LessonExercise = {
      id: "ex_no_opts",
      order: 1,
      type: "reorder",
      prompt: "No options",
      correctAnswer: "Test",
      explanation: "Test explanation",
    };

    // Renders without crashing when options is undefined
    const { rerender } = render(
      <InteractiveExercise exercise={reorderNoOptions} onAnswer={onAnswer} isAnswered={false} />
    );
    expect(screen.getByText("No options")).toBeInTheDocument();

    // Already answered multiple choice ignores further clicks
    const mcEx: LessonExercise = {
      id: "ex_mc",
      order: 2,
      type: "multiple_choice",
      prompt: "MC Prompt",
      options: ["Opt 1", "Opt 2"],
      correctAnswer: "Opt 1",
      explanation: "Test explanation",
    };

    rerender(
      <InteractiveExercise exercise={mcEx} onAnswer={onAnswer} isAnswered={true} wasCorrect={true} />
    );

    fireEvent.click(screen.getByText("Opt 2"));
    expect(onAnswer).not.toHaveBeenCalled();

    // Form submit on answered fill_blank does not trigger onAnswer
    const fbEx: LessonExercise = {
      id: "ex_fb",
      order: 3,
      type: "fill_blank",
      prompt: "FB Prompt",
      correctAnswer: "Ans",
      explanation: "Test explanation",
    };

    rerender(
      <InteractiveExercise exercise={fbEx} onAnswer={onAnswer} isAnswered={true} wasCorrect={true} />
    );

    const form = screen.queryByRole("form");
    if (form) {
      fireEvent.submit(form);
    }
    expect(onAnswer).not.toHaveBeenCalled();
  });
});

