-- New resource type: Listening (audio to listen to).
ALTER TYPE "ResourceKind" ADD VALUE IF NOT EXISTS 'LISTENING';

-- Printables are merged into Worksheet: same content, files, versions, topic links and
-- assignment activities; only the type changes, so nothing is lost.
UPDATE "LibraryResource" SET "kind" = 'WORKSHEET' WHERE "kind" = 'PRINTABLE';

-- Lesson setups confirmed per class ("" = the teacher's default order).
ALTER TABLE "TopicPlan" ADD COLUMN "classroomId" TEXT NOT NULL DEFAULT '';
DROP INDEX IF EXISTS "TopicPlan_teacherId_topicId_key";
CREATE UNIQUE INDEX "TopicPlan_teacherId_topicId_classroomId_key" ON "TopicPlan"("teacherId", "topicId", "classroomId");
