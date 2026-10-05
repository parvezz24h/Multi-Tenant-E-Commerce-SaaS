-- AlterTable
ALTER TABLE "store_domains" ADD COLUMN     "redirectActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "redirectError" TEXT;

