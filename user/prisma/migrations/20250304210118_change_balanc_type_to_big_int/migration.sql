/*
  Warnings:

  - You are about to alter the column `balance` on the `Wallet` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `BigInt`.

*/
-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "balance" SET DEFAULT 100000,
ALTER COLUMN "balance" SET DATA TYPE BIGINT;
