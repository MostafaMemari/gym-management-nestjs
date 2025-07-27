-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('NONE', 'LOW_BALANCE', 'CRITICAL_BALANCE', 'DEPLETED');

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "lastNotificationStatus" "NotificationStatus" NOT NULL DEFAULT 'NONE';
