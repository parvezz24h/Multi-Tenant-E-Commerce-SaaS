-- Offer a single plan: Starter (with custom domains). Business and Premium
-- are hidden from merchants, not deleted; re-enable them on /admin/plans.
UPDATE "plans" SET "customDomain" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "key" = 'starter';
UPDATE "plans" SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "key" IN ('business', 'premium');

-- Trials on a hidden plan continue on Starter (paid subscriptions keep their plan).
UPDATE "subscriptions"
SET "planId" = (SELECT "id" FROM "plans" WHERE "key" = 'starter'), "updatedAt" = CURRENT_TIMESTAMP
WHERE "status" = 'TRIAL'
  AND "planId" IN (SELECT "id" FROM "plans" WHERE "key" IN ('business', 'premium'));
