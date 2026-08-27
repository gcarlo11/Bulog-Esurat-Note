-- Penomoran Nota Verifikasi dan Nota Internal/Divisi dipisah per divisi/unit.
ALTER TABLE "Letter" ADD COLUMN IF NOT EXISTS "divisionUnit" TEXT;
ALTER TABLE "LetterVersion" ADD COLUMN IF NOT EXISTS "divisionUnit" TEXT;

UPDATE "Letter"
SET "divisionUnit" = 'MINKU_TU'
WHERE "category" IN ('NOTA_DIVISI', 'NOTA_VERIFIKASI')
  AND "divisionUnit" IS NULL;

CREATE INDEX IF NOT EXISTS "Letter_letterNumber_idx" ON "Letter"("letterNumber");
CREATE INDEX IF NOT EXISTS "Letter_category_divisionUnit_letterNumber_idx" ON "Letter"("category", "divisionUnit", "letterNumber");

ALTER TABLE "Letter" DROP CONSTRAINT IF EXISTS "Letter_letterNumber_key";
