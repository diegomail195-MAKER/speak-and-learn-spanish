-- Additive only: Community sharing of activities. Existing rows are untouched (both columns start NULL).
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "communitySharedAt" TIMESTAMP(3);
ALTER TABLE "Game" ADD COLUMN IF NOT EXISTS "copiedFromId" TEXT;

CREATE INDEX IF NOT EXISTS "Game_communitySharedAt_idx" ON "Game"("communitySharedAt");
CREATE INDEX IF NOT EXISTS "Game_copiedFromId_idx" ON "Game"("copiedFromId");
