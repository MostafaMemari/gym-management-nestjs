/*
  Warnings:

  - A unique constraint covering the columns `[walletId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "walletId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "User_walletId_key" ON "User"("walletId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE SET NULL ON UPDATE CASCADE;
