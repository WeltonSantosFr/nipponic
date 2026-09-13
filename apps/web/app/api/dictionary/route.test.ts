import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GET } from "./route";

describe("GET /api/dictionary", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    // Suppress console error and warn for clean test output
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  const mockRequest = (url: string) => new Request(url);

  it("should return 400 if word parameter is missing", async () => {
    const req = mockRequest("http://localhost/api/dictionary");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Word parameter is required" });
  });

  it("should return 400 if word parameter is empty", async () => {
    const req = mockRequest("http://localhost/api/dictionary?word=   ");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Word parameter is required" });
  });

  it("should handle 404 from upstream fetch", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });

    const req = mockRequest("http://localhost/api/dictionary?word=test");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Word not found" });
    expect(console.warn).not.toHaveBeenCalled(); // No warning for 404
  });

  it("should handle 500 from upstream fetch and return 502", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    const req = mockRequest("http://localhost/api/dictionary?word=test");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data).toEqual({ error: "Upstream dictionary service responded with 500" });
    expect(console.warn).toHaveBeenCalledWith('Jisho API responded with HTTP 500 for word "test"');
  });

  it("should handle 403 from upstream fetch and return 403", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    const req = mockRequest("http://localhost/api/dictionary?word=test");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: "Upstream dictionary service responded with 403" });
    expect(console.warn).toHaveBeenCalledWith('Jisho API responded with HTTP 403 for word "test"');
  });

  it("should handle successful fetch but empty data", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const req = mockRequest("http://localhost/api/dictionary?word=test");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Word not found" });
  });

  it("should handle successful fetch with definition data", async () => {
    const mockJishoData = {
      data: [
        {
          slug: "test",
          is_common: true,
          jlpt: ["jlpt-n5"],
          japanese: [
            { word: "テスト", reading: "てすと" }
          ],
          senses: [
            { english_definitions: ["test definition 1", "test definition 2"] }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockJishoData),
    });

    const req = mockRequest("http://localhost/api/dictionary?word=test");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      reading: "てすと",
      meanings: ["test definition 1, test definition 2"],
      jlpt: "N5",
      isCommon: true,
    });
    expect(response.headers.get("Cache-Control")).toBe("public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400");
  });

  it("should handle fetch throwing an exception", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));

    const req = mockRequest("http://localhost/api/dictionary?word=test");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data).toEqual({ error: "Failed to fetch word definition from dictionary" });
    expect(console.error).toHaveBeenCalled();
  });

  it("should match by japanese word or reading when slug differs", async () => {
    // Arrange
    const mockJishoData = {
      data: [
        {
          slug: "different-slug",
          is_common: false,
          jlpt: [],
          japanese: [
            { word: "猫", reading: "ねこ" }
          ],
          senses: [
            { english_definitions: ["cat"] }
          ]
        }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockJishoData),
    });

    const req = mockRequest("http://localhost/api/dictionary?word=猫");

    // Act
    const response = await GET(req);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data).toEqual({
      reading: "ねこ",
      meanings: ["cat"],
      jlpt: null,
      isCommon: false,
    });
  });
});
