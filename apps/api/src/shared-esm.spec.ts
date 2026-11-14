import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const API_ROOT = path.resolve(import.meta.dirname, "..");
const SHARED_PACKAGE_JSON = path.resolve(
  API_ROOT,
  "..",
  "..",
  "packages",
  "shared",
  "package.json",
);

describe("@nipponic/shared ESM compatibility", () => {
  it('declares "type": "module" in packages/shared/package.json', () => {
    const pkg = JSON.parse(readFileSync(SHARED_PACKAGE_JSON, "utf8")) as {
      type?: string;
    };

    expect(pkg.type).toBe("module");
  });

  it("exposes star-reexported symbols via Node ESM + tsx loader", () => {
    const script = [
      'import { DevUnlockTranslationSchema, SubmitTranslationSchema, LocalDateSchema, MVP_TRANSLATION_PROMPTS, evaluateTranslationAttempt, buildTranslationDailyState, getTodayLocalDate, FuriganaSegmentSchema } from "@nipponic/shared";',
      "console.log(JSON.stringify({",
      "  hasDevUnlock: Boolean(DevUnlockTranslationSchema),",
      "  hasSubmit: Boolean(SubmitTranslationSchema),",
      "  hasLocalDate: Boolean(LocalDateSchema),",
      "  promptCount: MVP_TRANSLATION_PROMPTS.length,",
      '  evalType: typeof evaluateTranslationAttempt,',
      '  stateType: typeof buildTranslationDailyState,',
      '  dateType: typeof getTodayLocalDate,',
      "  hasFurigana: Boolean(FuriganaSegmentSchema),",
      "}));",
    ].join(" ");

    const stdout = execFileSync(
      process.execPath,
      ["--import", "tsx", "--input-type=module", "-e", script],
      {
        cwd: API_ROOT,
        encoding: "utf8",
      },
    );

    const parsed = JSON.parse(stdout.trim()) as {
      hasDevUnlock: boolean;
      hasSubmit: boolean;
      hasLocalDate: boolean;
      promptCount: number;
      evalType: string;
      stateType: string;
      dateType: string;
      hasFurigana: boolean;
    };

    expect(parsed).toEqual({
      hasDevUnlock: true,
      hasSubmit: true,
      hasLocalDate: true,
      promptCount: 4,
      evalType: "function",
      stateType: "function",
      dateType: "function",
      hasFurigana: true,
    });
  });
});
