import { connectDatabase, db } from "./db.ts";

let pendingSeed: Promise<void> | undefined;

async function runSeed(): Promise<void> {
  await connectDatabase();
}

export function seed(): Promise<void> {
  pendingSeed ??= runSeed().catch((error: unknown) => {
    pendingSeed = undefined;
    throw error;
  });
  return pendingSeed;
}
