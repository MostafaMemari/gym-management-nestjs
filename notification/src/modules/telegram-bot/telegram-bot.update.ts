import { Ctx, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class TelegramBotUpdate {
  @Start()
  async startBot(@Ctx() ctx: Context) {
    await ctx.reply('hello sajad how are you?');
  }
}
