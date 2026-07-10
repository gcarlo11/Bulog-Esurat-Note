-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Letter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "letterNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'KELUAR_MASUK',
    "type" TEXT,
    "subject" TEXT NOT NULL,
    "sender" TEXT,
    "recipient" TEXT,
    "letterDate" DATETIME NOT NULL,
    "receivedDate" DATETIME,
    "description" TEXT,
    "classification" TEXT NOT NULL DEFAULT 'BIASA',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "archiveReason" TEXT,
    "agendaType" TEXT,
    "code" TEXT,
    "nomorBerkas" TEXT,
    "nomorPetunjuk" TEXT,
    "nominal" REAL,
    "paraf" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Letter_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Letter" ("archiveReason", "classification", "createdAt", "createdById", "description", "id", "letterDate", "letterNumber", "receivedDate", "recipient", "sender", "status", "subject", "type", "updatedAt") SELECT "archiveReason", "classification", "createdAt", "createdById", "description", "id", "letterDate", "letterNumber", "receivedDate", "recipient", "sender", "status", "subject", "type", "updatedAt" FROM "Letter";
DROP TABLE "Letter";
ALTER TABLE "new_Letter" RENAME TO "Letter";
CREATE UNIQUE INDEX "Letter_letterNumber_key" ON "Letter"("letterNumber");
CREATE TABLE "new_LetterVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL,
    "letterId" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'KELUAR_MASUK',
    "type" TEXT,
    "subject" TEXT NOT NULL,
    "sender" TEXT,
    "recipient" TEXT,
    "letterDate" DATETIME NOT NULL,
    "description" TEXT,
    "classification" TEXT NOT NULL,
    "changeNote" TEXT,
    "agendaType" TEXT,
    "code" TEXT,
    "nomorBerkas" TEXT,
    "nomorPetunjuk" TEXT,
    "nominal" REAL,
    "paraf" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LetterVersion_letterId_fkey" FOREIGN KEY ("letterId") REFERENCES "Letter" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_LetterVersion" ("changeNote", "classification", "createdAt", "description", "id", "letterDate", "letterId", "recipient", "sender", "subject", "version") SELECT "changeNote", "classification", "createdAt", "description", "id", "letterDate", "letterId", "recipient", "sender", "subject", "version" FROM "LetterVersion";
DROP TABLE "LetterVersion";
ALTER TABLE "new_LetterVersion" RENAME TO "LetterVersion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
