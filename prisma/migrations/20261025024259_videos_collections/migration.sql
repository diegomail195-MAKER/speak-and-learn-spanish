-- AlterTable
ALTER TABLE "public"."Assignment" ADD COLUMN     "collectionId" TEXT;

-- AlterTable
ALTER TABLE "public"."Video" ADD COLUMN     "captionsAssetId" TEXT,
ADD COLUMN     "captionsLanguage" TEXT NOT NULL DEFAULT 'es',
ADD COLUMN     "practiceGameId" TEXT;

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionVideo" (
    "collectionId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "CollectionVideo_pkey" PRIMARY KEY ("collectionId","videoId")
);

-- CreateTable
CREATE TABLE "public"."VideoProgress" (
    "studentId" TEXT NOT NULL,
    "videoId" TEXT NOT NULL,
    "positionSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "watchedSec" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "durationSec" DOUBLE PRECISION,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProgress_pkey" PRIMARY KEY ("studentId","videoId")
);

-- CreateIndex
CREATE INDEX "Collection_schoolId_idx" ON "public"."Collection"("schoolId");

-- AddForeignKey
ALTER TABLE "public"."Video" ADD CONSTRAINT "Video_captionsAssetId_fkey" FOREIGN KEY ("captionsAssetId") REFERENCES "public"."MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Video" ADD CONSTRAINT "Video_practiceGameId_fkey" FOREIGN KEY ("practiceGameId") REFERENCES "public"."Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Assignment" ADD CONSTRAINT "Assignment_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionVideo" ADD CONSTRAINT "CollectionVideo_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionVideo" ADD CONSTRAINT "CollectionVideo_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoProgress" ADD CONSTRAINT "VideoProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."VideoProgress" ADD CONSTRAINT "VideoProgress_videoId_fkey" FOREIGN KEY ("videoId") REFERENCES "public"."Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
