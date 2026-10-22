import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { FuriganaText } from "./furigana-text";

// Mock useKuromoji so we can test automated kana ruby rendering
vi.mock("@/hooks/use-kuromoji", () => ({
  useKuromoji: () => ({
    tokenize: (text: string) => {
      if (text === "極まりない") {
        return [
          {
            surface_form: "極まりない",
            reading: "キワマリナイ",
          },
        ];
      }
      return [{ surface_form: text, reading: "" }];
    },
  }),
}));

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
});
