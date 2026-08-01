-- Distinguish private personal workspaces from shared household workspaces.
ALTER TABLE "financial_space" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'PERSONAL';
