-- AlterTable
ALTER TABLE "public"."Game" ADD COLUMN     "folderId" TEXT;

-- CreateTable
CREATE TABLE "public"."ActivityFolder" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'sky',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityFolder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityFolder_teacherId_parentId_idx" ON "public"."ActivityFolder"("teacherId", "parentId");

-- CreateIndex
CREATE INDEX "Game_folderId_idx" ON "public"."Game"("folderId");

-- AddForeignKey
ALTER TABLE "public"."ActivityFolder" ADD CONSTRAINT "ActivityFolder_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "public"."Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ActivityFolder" ADD CONSTRAINT "ActivityFolder_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."ActivityFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Game" ADD CONSTRAINT "Game_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "public"."ActivityFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

