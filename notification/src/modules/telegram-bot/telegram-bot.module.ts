import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramBotUpdate } from './telegram-bot.update';
import { TelegramBotService } from './telegram-bot.service';

@Module({
    imports: [
        TelegrafModule.forRoot({
            token: process.env.TELEGRAM_BOT_TOKEN,
        }),
    ],
    providers: [TelegramBotUpdate, TelegramBotService],
    exports: [TelegramBotModule],
})
export class TelegramBotModule { }
