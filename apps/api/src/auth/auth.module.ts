import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { PrismaService } from "../prisma.service";
import { resolveJwtSecret } from "../config/jwt-secret";

@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: resolveJwtSecret(),
        signOptions: { expiresIn: "24h", algorithm: "HS256" },
        verifyOptions: { algorithms: ["HS256"] },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
