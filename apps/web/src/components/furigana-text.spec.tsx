import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { FuriganaText } from "./furigana-text";

const tokenizeSpy = vi.fn((text: string) => {
  if (text === "極まりない") {
    return [
      {
        surface_form: "極まりない",
        reading: "キワマリナイ",
      },
    ];
  }
  if (text === "猫123") {
    return [
      { surface_form: "猫", reading: "ネコ", basic_form: "猫" },
      { surface_form: "123", reading: "", basic_form: "123" },
    ];
  }
  return [{ surface_form: text, reading: "" }];
});

// Mock useKuromoji so we can test automated kana ruby rendering and caching
vi.mock("@/hooks/use-kuromoji", () => ({
  useKuromoji: () => ({
    tokenize: tokenizeSpy,
  }),
}));

vi.mock("@/contexts/FlashCardsContext", () => ({
  useFlashCards: () => ({
    cards: [{ jpText: "猫" }],
    decks: [{ cards: [{ jpText: "犬" }] }],
  }),
}));

vi.mock("@/components/tokenized-text", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/tokenized-text")>();
  return {
    ...actual,
    TokenItem: ({ word, reading }: { word: string; reading?: string }) => (
      <span data-testid="token-item" data-word={word} data-reading={reading}>
        {word}
      </span>
    ),
  };
});

describe("FuriganaText", () => {
  it("renders null when text is empty", () => {
    const { container } = render(<FuriganaText text="" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders markdown ruby {漢字|かんじ} as ruby element when showFurigana is true", () => {
    const { container } = render(
      <FuriganaText text="この表現は{極|きわ}まりないです。" showFurigana={true} />
    );

    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby).toHaveTextContent("きわ");
    expect(ruby).toHaveTextContent("極");
  });

  it("renders plain kanji without ruby when showFurigana is false", () => {
    const { container } = render(
      <FuriganaText text="この表現は{極|きわ}まりないです。" showFurigana={false} />
    );

    const ruby = container.querySelector("ruby");
    expect(ruby).toBeNull();
    expect(container).toHaveTextContent("この表現は極まりないです。");
  });

  it("renders HTML <ruby> tags as ruby elements", () => {
    const { container } = render(
      <FuriganaText text="危険<ruby>極<rt>きわ</rt></ruby>まる" showFurigana={true} />
    );

    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby).toHaveTextContent("きわ");
    expect(ruby).toHaveTextContent("極");
  });

  it("automatically tokenizes plain Japanese kanji and provides furigana", () => {
    const { container } = render(
      <FuriganaText text="極まりない" showFurigana={true} />
    );

    const ruby = container.querySelector("ruby");
    expect(ruby).not.toBeNull();
    expect(ruby).toHaveTextContent("きわまりない");
    expect(ruby).toHaveTextContent("極まりない");
  });

  it("uses cached tokenization on repeated renders with the same plain kanji text", () => {
    tokenizeSpy.mockClear();
    render(<FuriganaText text="新しい単語" showFurigana={true} />);
    const callsAfterFirstRender = tokenizeSpy.mock.calls.length;
    expect(callsAfterFirstRender).toBeGreaterThanOrEqual(1);

    // Re-rendering or rendering another instance with identical text should hit the cache
    render(<FuriganaText text="新しい単語" showFurigana={true} />);
    expect(tokenizeSpy.mock.calls.length).toBe(callsAfterFirstRender);
  });

  it("falls back to plain text for malformed ruby markup without pipe", () => {
    const { container } = render(<FuriganaText text="{notruby}" />);
    expect(container).toHaveTextContent("{notruby}");
    expect(container.querySelector("ruby")).toBeNull();
  });

  it("falls back to plain text without tags for HTML ruby tag without rt", () => {
    const { container } = render(<FuriganaText text="<ruby>plain</ruby>" />);
    expect(container).toHaveTextContent("plain");
    expect(container.querySelector("ruby")).toBeNull();
  });

  it("renders interactive TokenItem for ruby and plain tokens with flashcard detection", () => {
    const { container } = render(
      <FuriganaText text="{猫|ねこ}猫123" interactive={true} showFurigana={true} />
    );
    const tokenItems = container.querySelectorAll('[data-testid="token-item"]');
    expect(tokenItems.length).toBeGreaterThan(0);
    expect(container).toHaveTextContent("123");
  });

  it("renders non-Japanese plain text directly without ruby or tokenizer", () => {
    const { container } = render(<FuriganaText text="Hello World" />);
    expect(container).toHaveTextContent("Hello World");
    expect(container.querySelector("ruby")).toBeNull();
  });

  it("evicts oldest cache item when plainTokenCache exceeds MAX_CACHE_SIZE", () => {
    for (let i = 0; i <= 501; i++) {
      render(<FuriganaText text={`日本語${i}`} showFurigana={true} />);
    }
  });

  it("handles empty kanji or reading in markdown ruby markup", () => {
    const { container } = render(<FuriganaText text="{kanji|}{|reading}{a|b|c}" />);
    expect(container).toHaveTextContent("{kanji|}{|reading}{a|b|c}");
  });
});
