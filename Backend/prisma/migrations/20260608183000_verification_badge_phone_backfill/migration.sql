-- Keep phone_number uniqueness reliable even when legacy "phone" still has duplicates.
WITH normalized AS (
  SELECT
    id,
    NULLIF(regexp_replace(COALESCE("phoneNumber", "phone"), '[^\d+]', '', 'g'), '') AS normalized_phone
  FROM "User"
),
ranked AS (
  SELECT
    id,
    normalized_phone,
    row_number() OVER (PARTITION BY normalized_phone ORDER BY "createdAt", id) AS rn
  FROM normalized
  WHERE normalized_phone IS NOT NULL
)
UPDATE "User" AS u
SET
  "phone" = CASE WHEN ranked.rn = 1 THEN ranked.normalized_phone ELSE NULL END,
  "phoneNumber" = CASE WHEN ranked.rn = 1 THEN ranked.normalized_phone ELSE NULL END,
  "phoneVerified" = CASE WHEN ranked.rn = 1 THEN u."phoneVerified" ELSE false END,
  "phoneVerifiedAt" = CASE WHEN ranked.rn = 1 THEN u."phoneVerifiedAt" ELSE NULL END
FROM ranked
WHERE u.id = ranked.id;

-- The identity badge must reflect approved verification documents, not OAuth sign-in or manual drift.
UPDATE "User" AS u
SET "verified" = EXISTS (
  SELECT 1
  FROM "VerificationDocument" AS d
  WHERE d."userId" = u.id
    AND d."status" = 'VERIFIED'
);

CREATE UNIQUE INDEX IF NOT EXISTS "User_phoneNumber_key" ON "User"("phoneNumber");
