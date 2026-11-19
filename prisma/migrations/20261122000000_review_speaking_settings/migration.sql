-- Additive only: Speaking library resources, teacher review of speaking work, platform settings.
ALTER TYPE "ResourceKind" ADD VALUE IF NOT EXISTS 'SPEAKING';

ALTER TABLE "StudentAttempt" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "StudentAttempt" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "StudentAttempt" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT NOT NULL DEFAULT '';

ALTER TABLE "StudentResponse" ADD COLUMN IF NOT EXISTS "teacherOutcome" "ResponseOutcome";

ALTER TABLE "ActivityProgress" ADD COLUMN IF NOT EXISTS "details" JSONB;
ALTER TABLE "ActivityProgress" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "ActivityProgress" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
ALTER TABLE "ActivityProgress" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "signupOpen" BOOLEAN NOT NULL DEFAULT true,
    "announcement" TEXT NOT NULL DEFAULT '',
    "defaultTopicLanguage" TEXT NOT NULL DEFAULT 'es',
    "supportEmail" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);
