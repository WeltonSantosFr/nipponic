import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "../../../../app/api/kanji/route";

describe("GET /api/kanji", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 if char parameter is missing or empty", async () => {
    const req1 = new Request("https://localhost/api/kanji");
    const res1 = await GET(req1);
    expect(res1.status).toBe(400);
    const data1 = await res1.json();
    expect(data1.error).toBe("Kanji character parameter is required");

    const req2 = new Request("https://localhost/api/kanji?char=  ");
    const res2 = await GET(req2);
    expect(res2.status).toBe(400);
    const data2 = await res2.json();
    expect(data2.error).toBe("Kanji character parameter is required");
  });

  it("returns 200 with formatted KanjiInfo on successful lookup", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        kanji: "日",
        grade: 1,
        stroke_count: 4,
        meanings: ["day", "sun", "Japan"],
        kun_readings: ["ひ", "-び", "-か"],
        on_readings: ["ニチ", "ジツ"],
        name_readings: ["あ", "あき"],
        jlpt: 5,
        unicode: "65e5",
        heisig_en: "day",
      }),
    } as any);

    const req = new Request("https://localhost/api/kanji?char=日");
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("public, max-age=604800");

    const data = await res.json();
    expect(data).toEqual({
      kanji: "日",
      grade: 1,
      strokeCount: 4,
      meanings: ["day", "sun", "Japan"],
      kunReadings: ["ひ", "-び", "-か"],
      onReadings: ["ニチ", "ジツ"],
      nameReadings: ["あ", "あき"],
      jlpt: "N5",
      unicode: "65e5",
      heisig: "day",
    });
  });

  it("handles KanjiInfo without optional fields", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        kanji: "々",
        grade: null,
        stroke_count: 3,
        meanings: null,
        kun_readings: null,
        on_readings: null,
        name_readings: null,
        jlpt: null,
        unicode: "3005",
        heisig_en: null,
      }),
    } as any);

    const req = new Request("https://localhost/api/kanji?char=々");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.jlpt).toBeNull();
    expect(data.heisig).toBeNull();
    expect(data.meanings).toEqual([]);
    expect(data.kunReadings).toEqual([]);
  });

  it("returns 404 when kanji is not found in kanjiapi.dev", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    } as any);

    const req = new Request("https://localhost/api/kanji?char=xyz");
    const res = await GET(req);

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBe("Kanji not found");
  });

  it("returns 500 when external API fails with 500 or throws network error", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    } as any);

    const req1 = new Request("https://localhost/api/kanji?char=木");
    const res1 = await GET(req1);

    expect(res1.status).toBe(500);
    const data1 = await res1.json();
    expect(data1.error).toBe("Internal server error fetching kanji details");

    // Network error throwing
    global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));
    const req2 = new Request("https://localhost/api/kanji?char=木");
    const res2 = await GET(req2);

    expect(res2.status).toBe(500);
    const data2 = await res2.json();
    expect(data2.error).toBe("Internal server error fetching kanji details");

    consoleSpy.mockRestore();
  });
});
