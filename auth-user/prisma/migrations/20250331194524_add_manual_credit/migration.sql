-- CreateTable
CREATE TABLE "ManualCredit" (
    "id" SERIAL NOT NULL,
    "walletId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "creditedBy" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ManualCredit_pkey" PRIMARY KEY ("id")
);
