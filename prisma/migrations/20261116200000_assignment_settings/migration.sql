-- Per-assignment play options (e.g. flashcards: repeat until all correct, or each card once).
ALTER TABLE "Assignment" ADD COLUMN "settings" JSONB NOT NULL DEFAULT '{}';
