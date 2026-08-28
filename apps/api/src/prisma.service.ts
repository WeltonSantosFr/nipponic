import "dotenv/config";
import { Injectable } from "@nestjs/common";
import { db, listUsers, type StarterUser } from "./prisma/users";

@Injectable()
export class PrismaService {
  readonly db = db;

  listUsers(limit = 10): Promise<StarterUser[]> {
    return listUsers(limit);
  }

  // async onModuleDestroy() {
  //   await this.db.runtime().close();
  // }
}
