import fs from "node:fs";
import dns from "node:dns";
import postgres from "@prisma/orm-postgres/runtime";

dns.setDefaultResultOrder("ipv4first");

import service from "../../service.ts";
import type { Contract } from "./contract.d.ts";
import contractJson from "./contract.json" with { type: "json" };

function loadComposerDatabase() {
  try {
    return service.load().database.client;
  } catch {
    return undefined;
  }
}

function resolveDatabaseUrl(): string | undefined {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return undefined;

  const isInsideDocker =
    process.env.IS_DOCKER === "true" ||
    process.env.DOCKER === "true" ||
    fs.existsSync("/.dockerenv");

  if (isInsideDocker) {
    return rawUrl
      .replace("@127.0.0.1:", "@host.docker.internal:")
      .replace("@localhost:", "@host.docker.internal:");
  }

  return rawUrl;
}

const resolvedDbUrl = resolveDatabaseUrl();

export const db =
  loadComposerDatabase() ??
  (resolvedDbUrl
    ? postgres<Contract>({ contractJson, url: resolvedDbUrl })
    : postgres<Contract>({ contractJson }));

let connection: Promise<void> | undefined;

export function connectDatabase(): Promise<void> {
  connection ??= db
    .connect()
    .then(() => undefined)
    .catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
  return connection;
}
