-- CreateEnum
CREATE TYPE "DomainStatus" AS ENUM ('PENDING', 'ACTIVE');

-- CreateTable
CREATE TABLE "store_domains" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "hostname" TEXT NOT NULL,
    "status" "DomainStatus" NOT NULL DEFAULT 'PENDING',
    "records" JSONB,
    "lastCheckedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "store_domains_storeId_key" ON "store_domains"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "store_domains_hostname_key" ON "store_domains"("hostname");

-- CreateIndex
CREATE INDEX "store_domains_status_idx" ON "store_domains"("status");

-- AddForeignKey
ALTER TABLE "store_domains" ADD CONSTRAINT "store_domains_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

