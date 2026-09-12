import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("utils", () => {
  describe("cn", () => {
    it("should merge classes and properly resolve tailwind class conflicts", () => {
      // Arrange & Act
      const result = cn("px-2 py-1", "px-4", false && "hidden", null, undefined, "text-red-500");

      // Assert
      expect(result).toBe("py-1 px-4 text-red-500");
    });
  });
});
