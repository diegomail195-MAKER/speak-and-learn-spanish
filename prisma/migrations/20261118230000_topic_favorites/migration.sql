-- Library topics a teacher marked as favorite ("My favorites").
CREATE TABLE "TopicFavorite" (
    "teacherId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TopicFavorite_pkey" PRIMARY KEY ("teacherId","topicId")
);
CREATE INDEX "TopicFavorite_topicId_idx" ON "TopicFavorite"("topicId");
ALTER TABLE "TopicFavorite" ADD CONSTRAINT "TopicFavorite_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TopicFavorite" ADD CONSTRAINT "TopicFavorite_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
