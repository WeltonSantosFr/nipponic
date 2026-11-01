import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as deepl from "deepl-node";

const mockTranslateText = vi.fn();

vi.mock("deepl-node", () => {
  return {
    Translator: class {
      translateText = mockTranslateText;
    },
  };
});

import { POST } from "./route";

describe("POST /api/translate", () => {
  const originalEnv = process.env.DEEPL_AUTH_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    mockTranslateText.mockReset();
    process.env.DEEPL_AUTH_KEY = "test-auth-key";
  });

  afterEach(() => {
    process.env.DEEPL_AUTH_KEY = originalEnv;
  });

  it("returns 503 if DEEPL_AUTH_KEY is not configured", async () => {
    delete process.env.DEEPL_AUTH_KEY;

    const req = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello",
        sourceLang: "EN",
        targetLang: "JA",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.error).toContain("DEEPL_AUTH_KEY missing");
  });

  it("translates text from EN to JA successfully", async () => {
    mockTranslateText.mockResolvedValueOnce({
      text: "こんにちは",
      detectedSourceLang: "en",
    });

    const req = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "Hello",
        sourceLang: "EN",
        targetLang: "JA",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("こんにちは");
    expect(mockTranslateText).toHaveBeenCalledWith("Hello", "en", "ja");
  });

  it("translates text from JA to EN successfully", async () => {
    mockTranslateText.mockResolvedValueOnce({
      text: "Cat",
      detectedSourceLang: "ja",
    });

    const req = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "猫",
        sourceLang: "JA",
        targetLang: "EN",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("Cat");
    expect(mockTranslateText).toHaveBeenCalledWith("猫", "ja", "en-US");
  });

  it("handles PT source and target language mappings", async () => {
    mockTranslateText.mockResolvedValueOnce({
      text: "Olá",
      detectedSourceLang: "pt",
    });

    const req = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "Oi",
        sourceLang: "PT",
        targetLang: "PT",
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockTranslateText).toHaveBeenCalledWith("Oi", "pt", "pt-BR");
  });

  it("applies custom glossary replacement when forward match occurs in EN text", async () => {
    mockTranslateText
      // First call for whole text
      .mockResolvedValueOnce({
        text: "私はコーヒーが好きです。",
        detectedSourceLang: "en",
      })
      // Second call for single term "Coffee"
      .mockResolvedValueOnce({
        text: "コーヒー",
        detectedSourceLang: "en",
      });

    const req = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "I like Coffee a lot.",
        sourceLang: "EN",
        targetLang: "JA",
        glossaryRules: [
          { id: "g1", sourceTerm: "Coffee", targetTerm: "珈琲" },
          { id: "g2", sourceTerm: "   ", targetTerm: "test" }, // blank sourceTerm skipped on line 55
        ],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("私は珈琲が好きです。");
  });

  it("applies custom glossary replacement for Japanese source text", async () => {
    mockTranslateText
      .mockResolvedValueOnce({
        text: "I want to drink java.",
        detectedSourceLang: "ja",
      })
      .mockResolvedValueOnce({
        text: "java",
        detectedSourceLang: "ja",
      });

    const req = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "珈琲を飲みたい。",
        sourceLang: "JA",
        targetLang: "EN",
        glossaryRules: [{ id: "g1", sourceTerm: "珈琲", targetTerm: "Coffee" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("I want to drink Coffee.");
  });

  it("ignores single term lookup failure in glossary rules", async () => {
    mockTranslateText
      .mockResolvedValueOnce({
        text: "Hello world",
        detectedSourceLang: "ja",
      })
      .mockRejectedValueOnce(new Error("Glossary lookup error"));

    const req = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "こんにちは世界",
        sourceLang: "JA",
        targetLang: "EN",
        glossaryRules: [{ id: "g1", sourceTerm: "世界", targetTerm: "Earth" }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.translatedText).toBe("Hello world");
  });

  it("returns 500 when request body fails validation or translation throws error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Invalid body schema
    const req1 = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({ invalid: "data" }),
    });

    const res1 = await POST(req1);
    expect(res1.status).toBe(500);
    const data1 = await res1.json();
    expect(data1.error).toBe("Failed to process translation.");

    // Translator throwing error
    mockTranslateText.mockRejectedValueOnce(new Error("DeepL API timeout"));
    const req2 = new Request("https://localhost/api/translate", {
      method: "POST",
      body: JSON.stringify({
        text: "Error test",
        sourceLang: "EN",
        targetLang: "JA",
      }),
    });

    const res2 = await POST(req2);
    expect(res2.status).toBe(500);
    const data2 = await res2.json();
    expect(data2.error).toBe("Failed to process translation.");

    consoleSpy.mockRestore();
  });
});
