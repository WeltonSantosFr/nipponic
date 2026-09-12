import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LOCAL_API_URL,
  DEFAULT_PROD_API_URL,
  getApiUrl,
} from "./api-config";

describe("api-config", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    vi.stubEnv("API_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("should return NEXT_PUBLIC_API_URL if set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://custom-public-api.com");
    vi.stubEnv("API_URL", "https://custom-server-api.com");
    expect(getApiUrl()).toBe("https://custom-public-api.com");
  });

  it("should fallback to API_URL if NEXT_PUBLIC_API_URL is not set", () => {
    vi.stubEnv("API_URL", "https://custom-server-api.com");
    expect(getApiUrl()).toBe("https://custom-server-api.com");
  });

  it("should default to production URL when NODE_ENV is production and no env var is set", () => {
    vi.stubEnv("NODE_ENV", "production");
    expect(getApiUrl()).toBe(DEFAULT_PROD_API_URL);
    expect(getApiUrl()).toBe("https://nipponic.onrender.com");
  });

  it("should default to local URL when NODE_ENV is development or test and no env var is set", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(getApiUrl()).toBe(DEFAULT_LOCAL_API_URL);
    expect(getApiUrl()).toBe("http://localhost:3001");
  });
});
