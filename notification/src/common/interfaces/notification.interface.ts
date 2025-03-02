import { NotificationType } from "../enums/notification.type"

export interface ICreateNotification {
    message: string
    recipients?: number[] | null
    type?: NotificationType
    senderId?: number
}