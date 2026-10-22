import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MarkdownContent } from "./markdown-content";

describe("MarkdownContent", () => {
  it("renders null when content is empty", () => {
    const { container } = render(<MarkdownContent content="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders headings as semantic h1, h2, h3, h4 elements without raw hash tags", () => {
    const markdown = `
# Main Title
## Section Title
### Subsection Title
#### Small Header
`;
    render(<MarkdownContent content={markdown} />);

    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent("Main Title");
    expect(h1.textContent).not.toContain("#");

    const h2 = screen.getByRole("heading", { level: 2 });
    expect(h2).toHaveTextContent("Section Title");
    expect(h2.textContent).not.toContain("#");

    const h3 = screen.getByRole("heading", { level: 3 });
    expect(h3).toHaveTextContent("Subsection Title");
    expect(h3.textContent).not.toContain("#");

    const h4 = screen.getByRole("heading", { level: 4 });
    expect(h4).toHaveTextContent("Small Header");
    expect(h4.textContent).not.toContain("#");
  });

  it("renders inline formatting (bold, italic, codespan) correctly", () => {
    const markdown = "This is **bold text**, *italic text*, and `[Noun] + です` formula.";
    const { container } = render(<MarkdownContent content={markdown} />);

    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong).toHaveTextContent("bold text");

    const em = container.querySelector("em");
    expect(em).not.toBeNull();
    expect(em).toHaveTextContent("italic text");

    const code = container.querySelector("code");
    expect(code).not.toBeNull();
    expect(code).toHaveTextContent("[Noun] + です");
    expect(container.textContent).not.toContain("**");
    expect(container.textContent).not.toContain("`[Noun]");
  });

  it("renders unordered and ordered lists", () => {
    const markdown = `
- First bullet
- Second bullet

1. Step one
2. Step two
`;
    const { container } = render(<MarkdownContent content={markdown} />);

    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    const ulItems = ul?.querySelectorAll("li");
    expect(ulItems).toHaveLength(2);
    expect(ulItems?.[0]).toHaveTextContent("First bullet");

    const ol = container.querySelector("ol");
    expect(ol).not.toBeNull();
    const olItems = ol?.querySelectorAll("li");
    expect(olItems).toHaveLength(2);
    expect(olItems?.[0]).toHaveTextContent("Step one");
  });

  it("renders blockquotes and code blocks properly", () => {
    const markdown = `
> Cultural Tip: Remember to bow when introducing yourself.

\`\`\`japanese
こんにちは
\`\`\`
`;
    const { container } = render(<MarkdownContent content={markdown} />);

    const bq = container.querySelector("blockquote");
    expect(bq).not.toBeNull();
    expect(bq).toHaveTextContent("Cultural Tip: Remember to bow when introducing yourself.");

    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre).toHaveTextContent("こんにちは");
  });

  it("renders full lesson theory markdown without unrendered markdown markers", () => {
    const lessonTheory = `### Polite Copula (です) & Introductions

Learn how to introduce yourself and state identity using です (desu).

#### Key Formula
\`[Noun / Phrase] + です\`

#### Usage Notes
In polite Japanese (*Teineigo*), this pattern is used in everyday conversation to create natural and polite statements. Remember to match particle usage carefully.`;

    const { container } = render(<MarkdownContent content={lessonTheory} />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "Polite Copula (です) & Introductions"
    );

    const h4s = screen.getAllByRole("heading", { level: 4 });
    expect(h4s).toHaveLength(2);
    expect(h4s[0]).toHaveTextContent("Key Formula");
    expect(h4s[1]).toHaveTextContent("Usage Notes");

    const code = container.querySelector("code");
    expect(code).toHaveTextContent("[Noun / Phrase] + です");

    const em = container.querySelector("em");
    expect(em).toHaveTextContent("Teineigo");

    // Make sure no raw markdown symbols leaked as visible text
    expect(container.textContent).not.toContain("###");
    expect(container.textContent).not.toContain("####");
    expect(container.textContent).not.toContain("(*Teineigo*)");
  });

  it("renders ruby furigana notation {漢字|かんじ} as semantic ruby element", () => {
    const markdown = "Example: {失礼|しつれい}極まりない態度";
    const { container } = render(<MarkdownContent content={markdown} showFurigana={true} />);

    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby).toHaveTextContent("しつれい");
    expect(ruby).toHaveTextContent("失礼");
  });

  it("renders plain kanji without ruby when showFurigana is false", () => {
    const markdown = "Example: {失礼|しつれい}極まりない態度";
    const { container } = render(<MarkdownContent content={markdown} showFurigana={false} />);

    const ruby = container.querySelector("ruby");
    expect(ruby).toBeNull();
    expect(container).toHaveTextContent("失礼極まりない態度");
  });
});
