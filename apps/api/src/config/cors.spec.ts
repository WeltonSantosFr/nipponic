import { describe, it, expect } from "vitest";
import { buildCorsOrigins } from "./cors";

describe("buildCorsOrigins", () => {
  it("only returns explicit origins (no regex/wildcards)", () => {
    const origins = buildCorsOrigins({ NODE_ENV: "development" } as NodeJS.ProcessEnv);
    expect(origins.every((o) => typeof o === "string")).toBe(true);
  });

  it("does not allow lookalike vercel preview domains", () => {
    const origins = buildCorsOrigins({ NODE_ENV: "production" } as NodeJS.ProcessEnv);
    expect(origins).not.toContain("https://nipponic-web-evil.vercel.app");
    expect(origins).toEqual(["https://nipponic-web.vercel.app"]);
  });

  it("excludes localhost in production but includes it in development", () => {
    expect(buildCorsOrigins({ NODE_ENV: "production" } as NodeJS.ProcessEnv)).not.toContain("http://localhost:3000");
    expect(buildCorsOrigins({ NODE_ENV: "development" } as NodeJS.ProcessEnv)).toContain("http://localhost:3000");
  });

  it("adds trimmed FRONTEND_URL entries without trailing slashes, deduplicated", () => {
    const origins = buildCorsOrigins({
      NODE_ENV: "production",
      FRONTEND_URL: " https://app.example.com/ , https://nipponic-web.vercel.app ,",
    } as NodeJS.ProcessEnv);
    expect(origins).toEqual(["https://nipponic-web.vercel.app", "https://app.example.com"]);
  });
});
