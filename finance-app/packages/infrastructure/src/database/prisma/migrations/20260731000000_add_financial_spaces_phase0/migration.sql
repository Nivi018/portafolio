-- Phase 0: retain legacy userId ownership while financial-space assignment rolls out.
CREATE TABLE "financial_space" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "financial_space_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financial_space_member" (
    "id" TEXT NOT NULL,
    "financialSpaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "financial_space_member_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "category" ADD COLUMN "financialSpaceId" TEXT;
ALTER TABLE "finance_account" ADD COLUMN "financialSpaceId" TEXT;
ALTER TABLE "transaction" ADD COLUMN "financialSpaceId" TEXT;
ALTER TABLE "budget" ADD COLUMN "financialSpaceId" TEXT;
ALTER TABLE "goal" ADD COLUMN "financialSpaceId" TEXT;
ALTER TABLE "recurring_transaction" ADD COLUMN "financialSpaceId" TEXT;

CREATE UNIQUE INDEX "financial_space_member_financialSpaceId_userId_key" ON "financial_space_member"("financialSpaceId", "userId");
CREATE INDEX "financial_space_member_userId_idx" ON "financial_space_member"("userId");
CREATE INDEX "category_financialSpaceId_idx" ON "category"("financialSpaceId");
CREATE INDEX "finance_account_financialSpaceId_idx" ON "finance_account"("financialSpaceId");
CREATE INDEX "transaction_financialSpaceId_idx" ON "transaction"("financialSpaceId");
CREATE INDEX "budget_financialSpaceId_idx" ON "budget"("financialSpaceId");
CREATE INDEX "goal_financialSpaceId_idx" ON "goal"("financialSpaceId");
CREATE INDEX "recurring_transaction_financialSpaceId_idx" ON "recurring_transaction"("financialSpaceId");

ALTER TABLE "financial_space_member" ADD CONSTRAINT "financial_space_member_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "financial_space_member" ADD CONSTRAINT "financial_space_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "category" ADD CONSTRAINT "category_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_account" ADD CONSTRAINT "finance_account_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "budget" ADD CONSTRAINT "budget_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "goal" ADD CONSTRAINT "goal_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "recurring_transaction" ADD CONSTRAINT "recurring_transaction_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE SET NULL ON UPDATE CASCADE;
