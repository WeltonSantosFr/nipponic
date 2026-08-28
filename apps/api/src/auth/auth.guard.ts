import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { type Request } from "express";
import type { User } from "../user/users.dto";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(JwtService) private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & {user?: User}>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Token not provided");
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request["user"] = payload;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
