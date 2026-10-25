-- CreateTable
CREATE TABLE "public"."KeepWord" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "word" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KeepWord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KeepWord_schoolId_word_key" ON "public"."KeepWord"("schoolId", "word");

-- AddForeignKey
ALTER TABLE "public"."KeepWord" ADD CONSTRAINT "KeepWord_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "public"."School"("id") ON DELETE CASCADE ON UPDATE CASCADE;
