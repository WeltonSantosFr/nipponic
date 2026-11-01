import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "../../../../app/api/tts/route";

describe("TTS API Route (/api/tts)", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          arrayBuffer: () => Promise.resolve(new Uint8Array([1, 2, 3]).buffer),
        })
      )
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should return 400 when text parameter is missing in GET", async () => {
    const req = new Request("http://localhost:3000/api/tts");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Text parameter is required");
  });

  it("should return audio stream for short text in GET", async () => {
    const req = new Request("http://localhost:3000/api/tts?text=こんにちは&lang=ja-JP");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    const buffer = await res.arrayBuffer();
    expect(buffer.byteLength).toBe(3);
  });

  it("should chunk long Japanese text and combine audio in GET", async () => {
    const longText = "これは文1です。".repeat(20);
    const req = new Request(`http://localhost:3000/api/tts?text=${encodeURIComponent(longText)}&lang=ja`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    // Verifies that fetch was called multiple times for the chunks
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
  });

  it("should handle POST request with JSON body", async () => {
    const req = new Request("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "吾輩は猫である。", lang: "ja-JP" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
  });

  it("should return 400 for empty text in POST", async () => {
    const req = new Request("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   ", lang: "ja" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("should return 400 when text reduces to empty after stripping markdown", async () => {
    const req = new Request("http://localhost:3000/api/tts?text=```code%20block```&lang=ja");
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("No playable text provided");
  });

  it("should return 400 with invalid JSON body in POST", async () => {
    const req = new Request("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid-json-{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid request payload");
  });

  it("should handle non-Japanese language and default to 'en'", async () => {
    const req = new Request("http://localhost:3000/api/tts?text=Hello%20world&lang=en-US");
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("tl=en"),
      expect.any(Object)
    );
  });

  it("should return 500 when upstream TTS provider returns an error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 503,
    } as any);

    const req = new Request("http://localhost:3000/api/tts?text=Test%20error&lang=ja");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Failed to generate TTS audio");
    consoleSpy.mockRestore();
  });

  it("should split single long sentence with commas into multiple clauses", async () => {
    // Single sentence > 140 chars with commas
    const longSentenceWithCommas = "節1です、" + "長い節2です、".repeat(20) + "最後の節です。";
    const req = new Request(`http://localhost:3000/api/tts?text=${encodeURIComponent(longSentenceWithCommas)}&lang=ja`);
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(1);
  });

  it("should split single uninterrupted clause exceeding maxLen using character slicing fallback", async () => {
    // Single sentence > 140 chars without any punctuation or whitespace
    const continuousNoPunctuation = "あ".repeat(350);
    const req = new Request(`http://localhost:3000/api/tts?text=${encodeURIComponent(continuousNoPunctuation)}&lang=ja`);
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it("should default lang to 'en' in POST when lang is omitted", async () => {
    const req = new Request("http://localhost:3000/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Hello without explicit lang" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("tl=en"),
      expect.any(Object)
    );
  });

  it("should handle text with empty whitespace sentences and skip them", async () => {
    const req = new Request(
      `http://localhost:3000/api/tts?text=${encodeURIComponent("文1です。\n   \n文2です。")}&lang=ja`
    );
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
