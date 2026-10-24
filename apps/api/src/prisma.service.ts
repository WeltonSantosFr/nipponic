import "dotenv/config";
import { Injectable } from "@nestjs/common";
import { db, connectDatabase, listUsers, type StarterUser } from "./prisma/users";

@Injectable()
export class PrismaService {
  readonly db = db;

  async connect(): Promise<void> {
    await connectDatabase();
  }

  listUsers(limit = 10): Promise<StarterUser[]> {
    return listUsers(limit);
  }

  // async onModuleDestroy() {
  //   await this.db.runtime().close();
  // }
}
