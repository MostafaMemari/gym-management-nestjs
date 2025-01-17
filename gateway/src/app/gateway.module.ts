import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: ""
      }
   ])
],
  controllers: [],
  providers: [],
})
export class AppModule {}
