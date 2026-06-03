-- Add launch-critical phone verification fields without breaking existing users.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

WITH normalized AS (
  SELECT
    id,
    NULLIF(regexp_replace("phone", '[^\d+]', '', 'g'), '') AS "normalizedPhone"
  FROM "User"
  WHERE "phone" IS NOT NULL AND "phone" <> ''
),
ranked AS (
  SELECT
    id,
    "normalizedPhone",
    row_number() OVER (PARTITION BY "normalizedPhone" ORDER BY id) AS rn
  FROM normalized
  WHERE "normalizedPhone" IS NOT NULL
)
UPDATE "User" AS u
SET "phoneNumber" = CASE WHEN ranked.rn = 1 THEN ranked."normalizedPhone" ELSE NULL END
FROM ranked
WHERE u.id = ranked.id AND u."phoneNumber" IS NULL;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (PARTITION BY "phoneNumber" ORDER BY id) AS rn
  FROM "User"
  WHERE "phoneNumber" IS NOT NULL AND "phoneNumber" <> ''
)
UPDATE "User" AS u
SET
  "phoneNumber" = NULL,
  "phoneVerified" = false,
  "phoneVerifiedAt" = NULL
FROM ranked
WHERE u.id = ranked.id AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneNumber_key" ON "User"("phoneNumber");
CREATE INDEX IF NOT EXISTS "User_phoneVerified_idx" ON "User"("phoneVerified");
