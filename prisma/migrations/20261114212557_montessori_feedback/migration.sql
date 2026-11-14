-- Montessori Intelligent Feedback Engine. Additive only: new enum, two new tables and two new
-- columns with defaults on StudentResponse. No existing data is changed or removed.

-- CreateEnum
CREATE TYPE "public"."ProgressLevel" AS ENUM ('EXPLORING', 'DEVELOPING', 'PROGRESSING', 'PROFICIENT', 'EXTENDING');

-- AlterTable
ALTER TABLE "public"."StudentResponse" ADD COLUMN     "errorKind" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "selfCorrected" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."MontessoriSettings" (
    "id" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MontessoriSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."SkillProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "skillKey" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "topic" TEXT NOT NULL DEFAULT '',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "independentCorrect" INTEGER NOT NULL DEFAULT 0,
    "missed" INTEGER NOT NULL DEFAULT 0,
    "hintsUsed" INTEGER NOT NULL DEFAULT 0,
    "selfCorrections" INTEGER NOT NULL DEFAULT 0,
    "streak" INTEGER NOT NULL DEFAULT 0,
    "independentDays" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "contexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "level" "public"."ProgressLevel" NOT NULL DEFAULT 'EXPLORING',
    "teacherLevel" "public"."ProgressLevel",
    "teacherNote" TEXT NOT NULL DEFAULT '',
    "teacherUpdatedAt" TIMESTAMP(3),
    "teacherUpdatedById" TEXT,
    "lastActivity" TEXT NOT NULL DEFAULT '',
    "lastNeededHelpAt" TIMESTAMP(3),
    "lastPracticedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillProgress_studentId_topic_idx" ON "public"."SkillProgress"("studentId", "topic");

-- CreateIndex
CREATE UNIQUE INDEX "SkillProgress_studentId_skillKey_key" ON "public"."SkillProgress"("studentId", "skillKey");

-- AddForeignKey
ALTER TABLE "public"."SkillProgress" ADD CONSTRAINT "SkillProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
