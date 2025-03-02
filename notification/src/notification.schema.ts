import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationType } from './common/enums/notification.type';

@Schema({ versionKey: false, timestamps: true })
export class Notification extends Document<Notification> {
  @Prop({ type: Number, required: false, default: null })
  senderId: number | null;
  @Prop({ type: [Number], required: false, default: null })
  recipients: number[] | null;
  @Prop({ type: String, required: true, trim: true })
  message: string;
  @Prop({ type: String, enum: NotificationType, default: NotificationType.PUSH })
  type: NotificationType;
  @Prop({ type: Boolean, default: false, select: false })
  isRead: boolean
  @Prop({ type: [Number], default: [] })
  readBy: number[];
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
