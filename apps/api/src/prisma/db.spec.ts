import { describe, it, expect } from "vitest";
import dns from "node:dns";
import { db, connectDatabase } from "./db";

describe("db configuration", () => {
  it("should set DNS default result order to ipv4first", () => {
    expect(dns.getDefaultResultOrder()).toBe("ipv4first");
  });

  it("should export db and connectDatabase function", () => {
    expect(db).toBeDefined();
    expect(typeof connectDatabase).toBe("function");
  });
});
