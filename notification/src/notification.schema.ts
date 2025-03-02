import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ versionKey: false, timestamps: true })
export class Notification extends Document<Notification> {
    senderId: { type: Number, default: null }

    recipients: { type: [Number], default: null }

    message: { type: String, required: true }

    type: { type: String, enum: ['EMAIL', 'SMS', 'PUSH'], default: 'PUSH' }

    readBy: { type: [Number], default: [] }
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
