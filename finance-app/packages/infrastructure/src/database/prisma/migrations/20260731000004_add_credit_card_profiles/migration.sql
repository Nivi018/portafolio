-- Store credit-card-specific details separately from the base finance account.
CREATE TABLE "credit_card_profile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "creditLimit" DOUBLE PRECISION NOT NULL,
    "apr" DOUBLE PRECISION NOT NULL,
    "statementCloseDay" INTEGER NOT NULL,
    "paymentDueDay" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_card_profile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "credit_card_profile_accountId_key" ON "credit_card_profile"("accountId");

ALTER TABLE "credit_card_profile" ADD CONSTRAINT "credit_card_profile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "finance_account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
