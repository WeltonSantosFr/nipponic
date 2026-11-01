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

  it("renders tables with headers and rows properly", () => {
    const tableMarkdown = `
| Kanji | Reading | English |
| --- | --- | --- |
| 食べる | たべる | to eat |
| 飲む | のむ | to drink |
`;
    const { container } = render(<MarkdownContent content={tableMarkdown} />);

    const table = container.querySelector("table");
    expect(table).not.toBeNull();

    const headers = container.querySelectorAll("th");
    expect(headers).toHaveLength(3);
    expect(headers[0]).toHaveTextContent("Kanji");
    expect(headers[1]).toHaveTextContent("Reading");
    expect(headers[2]).toHaveTextContent("English");

    const rows = container.querySelectorAll("tbody tr");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("食べる");
    expect(rows[0]).toHaveTextContent("to eat");
  });

  it("renders horizontal rules (hr) when separated by triple dashes", () => {
    const markdown = "Above line\n\n---\n\nBelow line";
    const { container } = render(<MarkdownContent content={markdown} />);

    const hr = container.querySelector("hr");
    expect(hr).not.toBeNull();
  });

  it("renders links, strikethrough, and bold-italic formatted tokens", () => {
    const markdown = "Check [Nipponic](https://nipponic.app) with ~~wrong word~~ and ***super important***.";
    const { container } = render(<MarkdownContent content={markdown} />);

    const link = container.querySelector("a");
    expect(link).not.toBeNull();
    expect(link).toHaveAttribute("href", "https://nipponic.app");
    expect(link).toHaveTextContent("Nipponic");

    const del = container.querySelector("del");
    expect(del).not.toBeNull();
    expect(del).toHaveTextContent("wrong word");

    const strong = container.querySelector("strong.italic");
    expect(strong).not.toBeNull();
    expect(strong).toHaveTextContent("super important");
  });

  it("handles multiline paragraphs and breaking immediately on markdown delimiters", () => {
    const markdown = `First paragraph line
Second paragraph line
# Next Header`;
    const { container } = render(<MarkdownContent content={markdown} />);
    const p = container.querySelector("p");
    expect(p?.textContent).toContain("First paragraph line");
    expect(p?.textContent).toContain("Second paragraph line");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Next Header");
  });

  it("evicts oldest tokens from cache when cache exceeds maximum size", () => {
    for (let i = 0; i < 505; i++) {
      render(<MarkdownContent content={`Unique string token ${i}`} />);
    }
    expect(screen.getByText("Unique string token 504")).toBeInTheDocument();
  });

  it("handles underscore formatting, ruby annotations, and malformed inline syntax", () => {
    const markdown = `
__bold with underscores__ and _italic with underscores_
Ruby: {猫|ねこ} and <ruby>犬<rt>いぬ</rt></ruby>
Malformed ruby: <ruby>Broken</ruby> and {too|many|parts}
Malformed link: [not a link](
`;
    const { container } = render(<MarkdownContent content={markdown} />);

    // Underscores
    expect(screen.getByText("bold with underscores")).toBeInTheDocument();
    expect(screen.getByText("italic with underscores")).toBeInTheDocument();

    // Valid Ruby
    const rubyElements = container.querySelectorAll("ruby");
    expect(rubyElements.length).toBeGreaterThanOrEqual(2);
    expect(container.textContent).toContain("猫");
    expect(container.textContent).toContain("ねこ");
    expect(container.textContent).toContain("犬");
    expect(container.textContent).toContain("いぬ");

    // Malformed syntax fallbacks
    expect(container.textContent).toContain("Broken");
    expect(container.textContent).toContain("{too|many|parts}");
    expect(container.textContent).toContain("[not a link](");
  });
});
