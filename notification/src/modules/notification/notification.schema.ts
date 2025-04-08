import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { NotificationType } from '../../common/enums/notification.type';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../../common/enums/cache.enum';

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
  isRead: boolean;
  @Prop({ type: [Number], default: [] })
  readBy: number[];
  @Prop({ type: Boolean, default: false })
  isEdited: boolean;
}

export const NotificationSchemaFactory = (cacheService: CacheService) => {
  const schema = SchemaFactory.createForClass(Notification);

  schema.pre(['save', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'findOneAndUpdate', 'findOneAndDelete'], async (next) => {
    for (const key in CacheKeys) cacheService.delByPattern(`*${CacheKeys[key]}*`);

    next();
  });

  return schema;
};
