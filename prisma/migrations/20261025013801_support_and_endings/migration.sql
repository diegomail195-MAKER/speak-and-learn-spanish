-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "supportAudioId" TEXT,
ADD COLUMN     "supportLanguage" TEXT NOT NULL DEFAULT 'en-US',
ADD COLUMN     "supportText" TEXT NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE "public"."Question" ADD CONSTRAINT "Question_supportAudioId_fkey" FOREIGN KEY ("supportAudioId") REFERENCES "public"."AudioAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
