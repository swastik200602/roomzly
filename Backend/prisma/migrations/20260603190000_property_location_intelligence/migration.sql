ALTER TABLE "Property"
ADD COLUMN "locality" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "formattedAddress" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION;

CREATE INDEX "Property_state_idx" ON "Property"("state");
CREATE INDEX "Property_country_idx" ON "Property"("country");
CREATE INDEX "Property_locality_idx" ON "Property"("locality");
CREATE INDEX "Property_latitude_longitude_idx" ON "Property"("latitude", "longitude");
