-- AlterTable
ALTER TABLE "public"."GameItem" ADD COLUMN     "data" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "public"."Question" ADD COLUMN     "answerLanguage" TEXT;
