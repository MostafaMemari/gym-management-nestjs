import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Action, Command, Ctx, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';
import { TelegramBot } from './telegram-bot.schema';
import { ConflictException } from '@nestjs/common';

@Update()
export class TelegramBotUpdate {
  constructor(@InjectModel(TelegramBot.name) private readonly telegramBotModel: Model<TelegramBot>) {}

  @Start()
  async startBot(@Ctx() ctx: Context) {
    await ctx.reply(
      `سلام ${ctx.from.first_name} به ربات اعلانات آکادمی یاری خوش آمدید.`,
      Markup.inlineKeyboard([Markup.button.callback('ثبت کد ملی', `set_national`)]),
    );
  }

  @Action('set_national')
  async setNationalCode(@Ctx() ctx: Context) {
    await ctx.reply(`
لطفا کد ملی خود را وارد نمایید

راهنمایی: 
/set_national 0010350899
      `);
  }

  @Command('set_national')
  async setNational(@Ctx() ctx: Context) {
    try {
      const nationalCode = ctx.text?.split(' ')?.[1] || '';

      //TODO: Remove check pattern
      if (!nationalCode.match(/^[0-9]{10}$/)) {
        await ctx.reply('کد ملی نامعتبر می باشد.');
        return;
      }

      const existingNationalCode = await this.telegramBotModel.findOne({ nationalCode });

      if (existingNationalCode) throw new ConflictException('کد ملی از قبل ثبت شده است.');

      //TODO: Check and find national code from student service

      await this.telegramBotModel.create({
        nationalCode,
        telegramId: ctx.from.id,
      });

      await ctx.reply('کد ملی شما با موفقیت ثبت شد.✅ زین پس اعلانات مربوطه برای شما ارسال خواهد شد');

      await ctx.reply('کد ملی شما ثبت شد');
    } catch (error) {
      await ctx.reply(error.message);
    }
  }
}
