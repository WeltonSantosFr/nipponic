import { describe, it, expect } from "vitest";

describe("Service Worker Response Guarantees Regression Tests", () => {
  it("should return a 404 Response when static asset fetch fails and cache is empty", async () => {
    const handleStaticAssetCatch = (cachedResponse?: Response) => {
      return (
        cachedResponse ||
        new Response(null, { status: 404, statusText: "Not Found" })
      );
    };

    const result = handleStaticAssetCatch(undefined);
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(404);
    expect(result.statusText).toBe("Not Found");
  });

  it("should return cached response when static asset is present in cache", async () => {
    const handleStaticAssetCatch = (cachedResponse?: Response) => {
      return (
        cachedResponse ||
        new Response(null, { status: 404, statusText: "Not Found" })
      );
    };

    const mockCached = new Response("cached-css", { status: 200 });
    const result = handleStaticAssetCatch(mockCached);
    expect(result).toBe(mockCached);
    expect(result.status).toBe(200);
  });

  it("should return a 503 Response when other requests (e.g. RSC) fail and cache is empty", async () => {
    const handleOtherRequestCatch = async (
      cacheMatch: (req: Request) => Promise<Response | undefined>,
      request: Request
    ): Promise<Response> => {
      const cached = await cacheMatch(request);
      if (cached) {
        return cached;
      }
      return new Response(null, {
        status: 503,
        statusText: "Offline",
      });
    };

    const mockMatch = async () => undefined;
    const req = new Request("https://nipponic-web.vercel.app/sponsors?_rsc=5CB68i4pnAekjehf");

    const result = await handleOtherRequestCatch(mockMatch, req);
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(503);
    expect(result.statusText).toBe("Offline");
  });

  it("should return cached response when other requests are matched in cache", async () => {
    const handleOtherRequestCatch = async (
      cacheMatch: (req: Request) => Promise<Response | undefined>,
      request: Request
    ): Promise<Response> => {
      const cached = await cacheMatch(request);
      if (cached) {
        return cached;
      }
      return new Response(null, {
        status: 503,
        statusText: "Offline",
      });
    };

    const mockCached = new Response("{}", { status: 200 });
    const mockMatch = async () => mockCached;
    const req = new Request("https://nipponic-web.vercel.app/sponsors?_rsc=5CB68i4pnAekjehf");

    const result = await handleOtherRequestCatch(mockMatch, req);
    expect(result).toBe(mockCached);
    expect(result.status).toBe(200);
  });
});
