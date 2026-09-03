import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { PrismaService } from "./prisma.service";

import { UsersController } from "./user/users.controller";
import { UsersService } from "./user/users.service";
import { AuthController } from "./auth/auth.controller";
import { AuthService } from "./auth/auth.service";
import { AuthModule } from "./auth/auth.module";
import { NotesModule } from "./notes/notes.module";
import { CardsModule } from "./cards/cards.module";
import { DecksModule } from "./decks/decks.module";

@Module({
  imports: [AuthModule, NotesModule, CardsModule, DecksModule],
  controllers: [AppController, UsersController],
  providers: [PrismaService, UsersService],
})
export class AppModule {}
