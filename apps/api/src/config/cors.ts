/**
 * Builds the CORS allow-list. Only explicit origins are accepted: localhost for
 * development plus whatever is listed (comma separated) in FRONTEND_URL.
 * Wildcard/regex origins are intentionally not supported, since anyone can register
 * a lookalike subdomain on shared hosting platforms.
 */
export function buildCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = (env.FRONTEND_URL ?? "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  const defaults = ["https://nipponic-web.vercel.app"];
  if (env.NODE_ENV !== "production") {
    defaults.push("http://localhost:3000");
  }

  return [...new Set([...defaults, ...configured])];
}
