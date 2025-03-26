-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "WalletDeduction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "walletId" INTEGER NOT NULL,
    "deductionAmount" INTEGER NOT NULL,
    "remainingBalance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletDeduction_pkey" PRIMARY KEY ("id")
);
