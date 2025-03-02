import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class Notification extends Document<Notification> {
  @Prop({ type: Number, required: false, default: null })
  senderId: number | null;
  @Prop({ type: [Number], required: false, default: null })
  recipients: number[] | null;
  @Prop({ type: String, required: true, trim: true })
  message: string;
  @Prop({ type: String, enum: ['EMAIL', 'SMS', 'PUSH'], default: 'PUSH' })
  type: 'EMAIL' | 'SMS' | 'PUSH';
  @Prop({ type: [Number], default: [] })
  readBy: number[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
