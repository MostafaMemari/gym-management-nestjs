import { Module, ValidationPipe } from "@nestjs/common";

import { AuthController } from "./controllers/auth.controller";
import { ConfigModule } from "@nestjs/config";
import envConfig from "../configs/env.config";
import { UserController } from "./controllers/user.controller";
import { PermissionController } from "./controllers/permission.controller";
import { APP_PIPE } from "@nestjs/core";
import { RmqClientsModule } from "./rmq-clients.module";

@Module({
  imports: [ConfigModule.forRoot(envConfig()), RmqClientsModule],
  controllers: [AuthController, UserController, PermissionController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
  ],
})
export class GatewayModule {}
