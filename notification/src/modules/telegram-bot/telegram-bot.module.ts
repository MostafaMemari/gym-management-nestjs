import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { TelegramBotUpdate } from './telegram-bot.update';

@Module({
    imports: [
        TelegrafModule.forRoot({
            token: '7234274827:AAGt1D4Md37-C1Xzk4poAcEiZaRK6_JxrnM',
        }),
    ],
    providers: [TelegramBotUpdate],
    exports: [TelegramBotModule],
})
export class TelegramBotModule { }
