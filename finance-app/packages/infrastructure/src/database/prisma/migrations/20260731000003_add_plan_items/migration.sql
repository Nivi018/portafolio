-- Store planned income and expense items within a financial space.
CREATE TABLE "plan_item" (
    "id" TEXT NOT NULL,
    "financialSpaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "categoryId" TEXT,
    "accountId" TEXT,
    "isFixed" BOOLEAN NOT NULL DEFAULT false,
    "isMicroExpense" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_item_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "plan_item_financialSpaceId_idx" ON "plan_item"("financialSpaceId");
CREATE INDEX "plan_item_categoryId_idx" ON "plan_item"("categoryId");
CREATE INDEX "plan_item_accountId_idx" ON "plan_item"("accountId");

ALTER TABLE "plan_item" ADD CONSTRAINT "plan_item_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_item" ADD CONSTRAINT "plan_item_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "plan_item" ADD CONSTRAINT "plan_item_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance_account"("id") ON DELETE SET NULL ON UPDATE CASCADE;
