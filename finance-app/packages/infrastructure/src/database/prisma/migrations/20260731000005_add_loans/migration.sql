CREATE TABLE "loan" (
    "id" TEXT NOT NULL,
    "financialSpaceId" TEXT NOT NULL,
    "lender" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "originalPrincipal" DOUBLE PRECISION NOT NULL,
    "currentBalance" DOUBLE PRECISION NOT NULL,
    "annualRate" DOUBLE PRECISION NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyPayment" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "nextPaymentDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "loan_payment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loan_payment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "loan_financialSpaceId_idx" ON "loan"("financialSpaceId");
CREATE INDEX "loan_payment_loanId_idx" ON "loan_payment"("loanId");
CREATE UNIQUE INDEX "loan_payment_transactionId_key" ON "loan_payment"("transactionId");

ALTER TABLE "loan" ADD CONSTRAINT "loan_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loan_payment" ADD CONSTRAINT "loan_payment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "loan_payment" ADD CONSTRAINT "loan_payment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
