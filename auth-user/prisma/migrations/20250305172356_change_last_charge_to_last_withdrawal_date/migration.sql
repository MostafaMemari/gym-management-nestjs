/*
  Warnings:

  - You are about to drop the column `lastCharge` on the `Wallet` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Wallet" DROP COLUMN "lastCharge",
ADD COLUMN     "lastWithdrawalDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
