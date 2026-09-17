import "dotenv/config";
import "reflect-metadata";
import dns from "node:dns";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

// Render containers do not have outbound IPv6 routing. When connecting to databases
// hosted on AWS/Supabase/Neon that have dual-stack DNS records, Node.js attempts
// IPv6 first and fails with `ENETUNREACH`. Prioritizing IPv4 resolves this issue.
dns.setDefaultResultOrder("ipv4first");

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const defaultOrigins: (string | RegExp)[] = [
    "http://localhost:3000",
    "https://nipponic-web.vercel.app",
    /^https:\/\/nipponic-web.*\.vercel\.app$/,
  ];
  const envOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

  app.enableCors({
    origin: [...defaultOrigins, ...envOrigins],
    credentials: true,
  });
  
  const rawPort = (process.env.PORT ?? "").trim();
  const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
  const port =
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535
      ? parsedPort
      : 3001;
  await app.listen(port);
  console.log(`Server running at http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
