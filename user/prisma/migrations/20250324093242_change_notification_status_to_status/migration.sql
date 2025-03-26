/*
  Warnings:

  - You are about to drop the column `lastNotificationStatus` on the `Wallet` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WalletStatus" AS ENUM ('NONE', 'LOW_BALANCE', 'CRITICAL_BALANCE', 'DEPLETED');

-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "lastNotificationStatus",
ADD COLUMN     "status" "WalletStatus" NOT NULL DEFAULT 'NONE';

-- DropEnum
DROP TYPE "NotificationStatus";
