CREATE TYPE "DayOfWeek" AS ENUM (
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY'
);

CREATE TABLE "TimetableEntry" (
  "id" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "teacherId" TEXT NOT NULL,
  "dayOfWeek" "DayOfWeek" NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "room" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "TimetableEntry_classId_subjectId_fkey"
    FOREIGN KEY ("classId", "subjectId")
    REFERENCES "ClassSubject" ("classId", "subjectId")
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT "TimetableEntry_teacherId_fkey"
    FOREIGN KEY ("teacherId")
    REFERENCES "Teacher" ("id")
    ON DELETE RESTRICT
    ON UPDATE CASCADE
);

CREATE INDEX "TimetableEntry_classId_dayOfWeek_idx"
  ON "TimetableEntry" ("classId", "dayOfWeek");

CREATE INDEX "TimetableEntry_teacherId_dayOfWeek_idx"
  ON "TimetableEntry" ("teacherId", "dayOfWeek");
