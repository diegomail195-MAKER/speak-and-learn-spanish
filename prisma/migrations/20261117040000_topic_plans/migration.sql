-- Topic steps can be the teacher's own activities (games), not only library resources.
ALTER TABLE "AssignmentActivity" ALTER COLUMN "resourceId" DROP NOT NULL;
ALTER TABLE "AssignmentActivity" ALTER COLUMN "versionId" DROP NOT NULL;
ALTER TABLE "AssignmentActivity" ADD COLUMN "gameId" TEXT;
CREATE INDEX "AssignmentActivity_gameId_idx" ON "AssignmentActivity"("gameId");
ALTER TABLE "AssignmentActivity" ADD CONSTRAINT "AssignmentActivity_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- A teacher's lesson order for a Library topic.
CREATE TABLE "TopicPlan" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "steps" TEXT[],
    "hidden" TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TopicPlan_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "TopicPlan_teacherId_topicId_key" ON "TopicPlan"("teacherId", "topicId");
ALTER TABLE "TopicPlan" ADD CONSTRAINT "TopicPlan_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopicPlan" ADD CONSTRAINT "TopicPlan_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
