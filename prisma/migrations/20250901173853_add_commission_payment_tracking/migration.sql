-- AlterTable
ALTER TABLE "Post" ADD COLUMN "completionConfirmedAt" DATETIME;
ALTER TABLE "Post" ADD COLUMN "completionRequestedAt" DATETIME;
ALTER TABLE "Post" ADD COLUMN "finalPaymentAmount" REAL;
ALTER TABLE "Post" ADD COLUMN "finalPaymentAt" DATETIME;
ALTER TABLE "Post" ADD COLUMN "initialPaymentAmount" REAL;
ALTER TABLE "Post" ADD COLUMN "initialPaymentAt" DATETIME;
