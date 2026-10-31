import { Logger } from "@nestjs/common";
import { randomBytes } from "node:crypto";

const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Resolves the JWT signing secret.
 * - Production (or any env other than development/test): `JWT_SECRET` is mandatory
 *   and must be at least 32 characters. The process refuses to boot otherwise.
 * - Development/test: falls back to a random per-process secret (tokens do not
 *   survive restarts) instead of a hardcoded value that anyone could use.
 */
export function resolveJwtSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.JWT_SECRET?.trim();
  const isLocal = env.NODE_ENV === "development" || env.NODE_ENV === "test";

  if (secret) {
    if (secret.length < MIN_JWT_SECRET_LENGTH && !isLocal) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters long`,
      );
    }
    return secret;
  }

  if (!isLocal) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  new Logger("Config").warn(
    "JWT_SECRET is not set. Using a random ephemeral secret (tokens are invalidated on restart).",
  );
  return randomBytes(48).toString("hex");
}
