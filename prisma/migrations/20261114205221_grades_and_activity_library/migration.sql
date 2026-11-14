-- AlterTable
ALTER TABLE "public"."Topic" ADD COLUMN     "gradeId" TEXT;

-- CreateTable
CREATE TABLE "public"."Grade" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Grade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GameResource" (
    "gameId" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "GameResource_pkey" PRIMARY KEY ("gameId","resourceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Grade_nameKey_key" ON "public"."Grade"("nameKey");

-- CreateIndex
CREATE INDEX "GameResource_resourceId_idx" ON "public"."GameResource"("resourceId");

-- CreateIndex
CREATE INDEX "Topic_gradeId_idx" ON "public"."Topic"("gradeId");

-- AddForeignKey
ALTER TABLE "public"."Topic" ADD CONSTRAINT "Topic_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES "public"."Grade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameResource" ADD CONSTRAINT "GameResource_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "public"."Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GameResource" ADD CONSTRAINT "GameResource_resourceId_fkey" FOREIGN KEY ("resourceId") REFERENCES "public"."LibraryResource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
