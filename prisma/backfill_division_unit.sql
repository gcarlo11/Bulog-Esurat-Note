UPDATE "Letter"
SET "divisionUnit" = 'MINKU_TU'
WHERE "category" IN ('NOTA_DIVISI', 'NOTA_VERIFIKASI')
  AND "divisionUnit" IS NULL;
