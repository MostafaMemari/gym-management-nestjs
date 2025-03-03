import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ versionKey: false, timestamps: true })
export class TelegramBot extends Document<TelegramBot> {
    @Prop({ type: String, required: true, trim: true, unique: true })
    nationalId: string

    @Prop({ type: Number, required: true, unique: true })
    telegramId: string
}

export const TelegramBotSchema = SchemaFactory.createForClass(TelegramBot)