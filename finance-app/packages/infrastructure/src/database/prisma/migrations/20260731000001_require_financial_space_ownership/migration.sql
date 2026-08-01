-- Replace legacy per-user finance ownership with required financial-space ownership.
WITH finance_users AS (
  SELECT "userId" FROM "category" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "finance_account" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "transaction" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "budget" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "goal" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "recurring_transaction" WHERE "financialSpaceId" IS NULL
)
INSERT INTO "financial_space" ("id", "name", "createdAt", "updatedAt")
SELECT 'personal-' || "userId", 'Personal', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM finance_users
ON CONFLICT ("id") DO NOTHING;

WITH finance_users AS (
  SELECT "userId" FROM "category" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "finance_account" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "transaction" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "budget" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "goal" WHERE "financialSpaceId" IS NULL
  UNION SELECT "userId" FROM "recurring_transaction" WHERE "financialSpaceId" IS NULL
)
INSERT INTO "financial_space_member" ("id", "financialSpaceId", "userId", "role", "createdAt")
SELECT 'personal-member-' || "userId", 'personal-' || "userId", "userId", 'OWNER', CURRENT_TIMESTAMP
FROM finance_users
ON CONFLICT ("financialSpaceId", "userId") DO NOTHING;

UPDATE "category" SET "financialSpaceId" = 'personal-' || "userId" WHERE "financialSpaceId" IS NULL;
UPDATE "finance_account" SET "financialSpaceId" = 'personal-' || "userId" WHERE "financialSpaceId" IS NULL;
UPDATE "transaction" SET "financialSpaceId" = 'personal-' || "userId" WHERE "financialSpaceId" IS NULL;
UPDATE "budget" SET "financialSpaceId" = 'personal-' || "userId" WHERE "financialSpaceId" IS NULL;
UPDATE "goal" SET "financialSpaceId" = 'personal-' || "userId" WHERE "financialSpaceId" IS NULL;
UPDATE "recurring_transaction" SET "financialSpaceId" = 'personal-' || "userId" WHERE "financialSpaceId" IS NULL;

WITH finance_memberships AS (
  SELECT "financialSpaceId", "userId" FROM "category"
  UNION SELECT "financialSpaceId", "userId" FROM "finance_account"
  UNION SELECT "financialSpaceId", "userId" FROM "transaction"
  UNION SELECT "financialSpaceId", "userId" FROM "budget"
  UNION SELECT "financialSpaceId", "userId" FROM "goal"
  UNION SELECT "financialSpaceId", "userId" FROM "recurring_transaction"
)
INSERT INTO "financial_space_member" ("id", "financialSpaceId", "userId", "role", "createdAt")
SELECT 'owner-' || "financialSpaceId" || '-' || "userId", "financialSpaceId", "userId", 'OWNER', CURRENT_TIMESTAMP
FROM finance_memberships
ON CONFLICT ("financialSpaceId", "userId") DO NOTHING;

ALTER TABLE "category" DROP CONSTRAINT "category_userId_fkey", DROP CONSTRAINT "category_financialSpaceId_fkey";
ALTER TABLE "finance_account" DROP CONSTRAINT "finance_account_userId_fkey", DROP CONSTRAINT "finance_account_financialSpaceId_fkey";
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_userId_fkey", DROP CONSTRAINT "transaction_financialSpaceId_fkey";
ALTER TABLE "budget" DROP CONSTRAINT "budget_userId_fkey", DROP CONSTRAINT "budget_financialSpaceId_fkey";
ALTER TABLE "goal" DROP CONSTRAINT "goal_userId_fkey", DROP CONSTRAINT "goal_financialSpaceId_fkey";
ALTER TABLE "recurring_transaction" DROP CONSTRAINT "recurring_transaction_userId_fkey", DROP CONSTRAINT "recurring_transaction_financialSpaceId_fkey";

DROP INDEX "category_userId_idx", "category_name_userId_key", "finance_account_userId_idx", "transaction_userId_idx", "transaction_userId_date_idx", "budget_userId_idx", "goal_userId_idx", "recurring_transaction_userId_idx";

ALTER TABLE "category" ALTER COLUMN "financialSpaceId" SET NOT NULL, DROP COLUMN "userId";
ALTER TABLE "finance_account" ALTER COLUMN "financialSpaceId" SET NOT NULL, DROP COLUMN "userId";
ALTER TABLE "transaction" ALTER COLUMN "financialSpaceId" SET NOT NULL, DROP COLUMN "userId";
ALTER TABLE "budget" ALTER COLUMN "financialSpaceId" SET NOT NULL, DROP COLUMN "userId";
ALTER TABLE "goal" ALTER COLUMN "financialSpaceId" SET NOT NULL, DROP COLUMN "userId";
ALTER TABLE "recurring_transaction" ALTER COLUMN "financialSpaceId" SET NOT NULL, DROP COLUMN "userId";

CREATE UNIQUE INDEX "category_name_financialSpaceId_key" ON "category"("name", "financialSpaceId");
CREATE INDEX "transaction_financialSpaceId_date_idx" ON "transaction"("financialSpaceId", "date");

ALTER TABLE "category" ADD CONSTRAINT "category_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_account" ADD CONSTRAINT "finance_account_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "budget" ADD CONSTRAINT "budget_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "goal" ADD CONSTRAINT "goal_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
