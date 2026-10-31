import { describe, it, expect } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { CreateUserSchema, CreateCardSchema, ReviewCardSchema } from "@nipponic/shared";
import { ZodValidationPipe } from "./zod-validation.pipe";

describe("ZodValidationPipe", () => {
  it("returns parsed data for a valid payload", () => {
    const pipe = new ZodValidationPipe(CreateUserSchema);
    expect(pipe.transform({ username: "a", email: "a@b.co", password: "secret1" })).toEqual({
      username: "a",
      email: "a@b.co",
      password: "secret1",
    });
  });

  it("rejects invalid payloads with 400 and field-level errors", () => {
    const pipe = new ZodValidationPipe(CreateUserSchema);
    try {
      pipe.transform({ username: "", email: "nope", password: "1" });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      const body = (e as BadRequestException).getResponse() as { errors: { path: string }[] };
      expect(body.errors.map((x) => x.path).sort()).toEqual(["email", "password", "username"]);
    }
  });

  it("rejects a missing body instead of passing undefined through", () => {
    expect(() => new ZodValidationPipe(CreateUserSchema).transform(undefined)).toThrow(BadRequestException);
  });

  it("strips unknown properties (mass-assignment protection)", () => {
    const pipe = new ZodValidationPipe(CreateCardSchema);
    const result = pipe.transform({ jpText: "猫", enText: "cat", userId: "attacker", id: "x" });
    expect(result).not.toHaveProperty("userId");
    expect(result).not.toHaveProperty("id");
  });

  it("rejects out-of-range review ratings", () => {
    expect(() => new ZodValidationPipe(ReviewCardSchema).transform({ rating: 99 })).toThrow(BadRequestException);
  });
});
