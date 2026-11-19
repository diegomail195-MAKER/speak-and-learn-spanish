-- Dashboards (Platform Admin / Teacher View). Additive only: new nullable/defaulted columns and a
-- new table, so the current production code keeps working against the same database.

-- Topic language (Platform Admin › Topics)
ALTER TABLE "Topic" ADD COLUMN IF NOT EXISTS "language" TEXT NOT NULL DEFAULT 'es';

-- Archived classes
ALTER TABLE "Classroom" ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3);

-- Co-teachers
CREATE TABLE IF NOT EXISTS "ClassroomTeacher" (
    "classroomId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassroomTeacher_pkey" PRIMARY KEY ("classroomId","teacherId")
);
CREATE INDEX IF NOT EXISTS "ClassroomTeacher_teacherId_idx" ON "ClassroomTeacher"("teacherId");
DO $$ BEGIN
  ALTER TABLE "ClassroomTeacher" ADD CONSTRAINT "ClassroomTeacher_classroomId_fkey" FOREIGN KEY ("classroomId") REFERENCES "Classroom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "ClassroomTeacher" ADD CONSTRAINT "ClassroomTeacher_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
