/*
  Warnings:

  - You are about to drop the column `refId` on the `Transaction` table. All the data in the column will be lost.
  - Added the required column `authority` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "refId",
ADD COLUMN     "authority" TEXT NOT NULL;
