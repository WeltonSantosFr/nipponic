import { describe, it, expect, vi } from "vitest";
import { BadRequestException, type ArgumentsHost } from "@nestjs/common";
import { AllExceptionsFilter } from "./all-exceptions.filter";

function hostWith() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe("AllExceptionsFilter", () => {
  it("passes HttpExceptions through with their status and body", () => {
    const { host, status, json } = hostWith();
    new AllExceptionsFilter().catch(new BadRequestException("bad input"), host);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ message: "bad input" }));
  });

  it("hides internal error details behind a generic 500", () => {
    const { host, status, json } = hostWith();
    new AllExceptionsFilter().catch(new Error('relation "User" does not exist at /app/secret/path.ts'), host);
    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0];
    expect(JSON.stringify(body)).not.toContain("relation");
    expect(JSON.stringify(body)).not.toContain("secret/path");
    expect(body.message).toBe("Internal server error");
  });
});
