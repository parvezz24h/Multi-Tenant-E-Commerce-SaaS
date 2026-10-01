-- Unguessable token for the customer's order confirmation / tracking page.
-- Added nullable, backfilled for existing orders, then made required.
ALTER TABLE "orders" ADD COLUMN "publicToken" TEXT;

UPDATE "orders"
SET "publicToken" = replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')
WHERE "publicToken" IS NULL;

ALTER TABLE "orders" ALTER COLUMN "publicToken" SET NOT NULL;

CREATE UNIQUE INDEX "orders_publicToken_key" ON "orders"("publicToken");

CREATE INDEX "orders_storeId_phone_createdAt_idx" ON "orders"("storeId", "phone", "createdAt");
