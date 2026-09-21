import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET, POST } from "./route";

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
});
