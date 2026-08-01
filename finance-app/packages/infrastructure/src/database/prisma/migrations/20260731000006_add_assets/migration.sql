CREATE TABLE "asset" (
    "id" TEXT NOT NULL,
    "financialSpaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "asset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_valuation" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "asset_valuation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "asset_financialSpaceId_idx" ON "asset"("financialSpaceId");
CREATE INDEX "asset_valuation_assetId_date_idx" ON "asset_valuation"("assetId", "date");

ALTER TABLE "asset" ADD CONSTRAINT "asset_financialSpaceId_fkey" FOREIGN KEY ("financialSpaceId") REFERENCES "financial_space"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "asset_valuation" ADD CONSTRAINT "asset_valuation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;
