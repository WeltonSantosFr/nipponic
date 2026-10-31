import "dotenv/config";
import "reflect-metadata";
import dns from "node:dns";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/all-exceptions.filter";
import { buildCorsOrigins } from "./config/cors";

// Render containers do not have outbound IPv6 routing. When connecting to databases
// hosted on AWS/Supabase/Neon that have dual-stack DNS records, Node.js attempts
// IPv6 first and fails with `ENETUNREACH`. Prioritizing IPv4 resolves this issue.
dns.setDefaultResultOrder("ipv4first");

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  // `rawBody` is required to verify the GitHub Sponsors webhook HMAC signature.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    bodyParser: true,
  });

  // The API runs behind a reverse proxy (Oracle/Render/etc.): trust the first hop so
  // rate limiting keys on the real client IP instead of the proxy address.
  app.set("trust proxy", 1);
  app.useBodyParser("json", { limit: "100kb" });
  app.useBodyParser("urlencoded", { extended: true, limit: "100kb" });

  app.use(helmet());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  app.enableCors({
    origin: buildCorsOrigins(),
    credentials: true,
  });

  const rawPort = (process.env.PORT ?? "").trim();
  const parsedPort = rawPort.length > 0 ? Number(rawPort) : Number.NaN;
  const port =
    Number.isFinite(parsedPort) && parsedPort >= 0 && parsedPort <= 65535
      ? parsedPort
      : 3001;
  await app.listen(port);
  logger.log(`Server running at http://localhost:${port}`);
}

bootstrap().catch((error) => {
  new Logger("Bootstrap").error("Failed to start server", error);
  process.exit(1);
});
