/*
  Warnings:

  - The values [INSUFFICIENT_FUNDS] on the enum `WalletStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "WalletStatus_new" AS ENUM ('NONE', 'LOW_BALANCE', 'CRITICAL_BALANCE', 'DEPLETED');
ALTER TABLE "Wallet" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Wallet" ALTER COLUMN "status" TYPE "WalletStatus_new" USING ("status"::text::"WalletStatus_new");
ALTER TYPE "WalletStatus" RENAME TO "WalletStatus_old";
ALTER TYPE "WalletStatus_new" RENAME TO "WalletStatus";
DROP TYPE "WalletStatus_old";
ALTER TABLE "Wallet" ALTER COLUMN "status" SET DEFAULT 'NONE';
COMMIT;
