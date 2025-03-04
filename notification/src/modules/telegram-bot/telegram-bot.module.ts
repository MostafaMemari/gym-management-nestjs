import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramBotUpdate } from './telegram-bot.update';
import { TelegramBotService } from './telegram-bot.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TelegramBot, TelegramBotSchema } from './telegram-bot.schema';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.TELEGRAM_BOT_TOKEN,
    }),
    MongooseModule.forFeature([{ name: TelegramBot.name, schema: TelegramBotSchema }]),
  ],
  providers: [TelegramBotUpdate, TelegramBotService],
  exports: [TelegramBotModule],
})
export class TelegramBotModule {}
