import { Module } from "@nestjs/common";
import { StudentController } from "./student.controller";
import { StudentService } from "./student.service";
import { ConfigModule } from "@nestjs/config";
import envConfig from "./configs/env.config";

@Module({
  imports: [ConfigModule.forRoot(envConfig())],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
