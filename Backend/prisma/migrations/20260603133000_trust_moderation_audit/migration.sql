ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "VerificationStatus" ADD VALUE IF NOT EXISTS 'RESUBMISSION_REQUESTED';

CREATE TYPE "AdminAuditAction" AS ENUM (
    'USER_BAN',
    'USER_UNBAN',
    'USER_VERIFICATION',
    'USER_ROLE_CHANGE',
    'PROPERTY_APPROVAL',
    'PROPERTY_REJECTION',
    'PROPERTY_DELETION',
    'PROPERTY_FEATURE',
    'PROPERTY_UNFEATURE',
    'REPORT_RESOLUTION',
    'VERIFICATION_APPROVAL',
    'VERIFICATION_REJECTION',
    'VERIFICATION_RESUBMISSION_REQUEST',
    'ADMIN_LOGIN',
    'ADMIN_LOGOUT'
);

CREATE TYPE "ReportType" AS ENUM (
    'FAKE_LISTING',
    'SCAM',
    'HARASSMENT',
    'SPAM',
    'FAKE_BROKER'
);

CREATE TYPE "ReportStatus" AS ENUM (
    'PENDING',
    'INVESTIGATING',
    'RESOLVED'
);

CREATE TYPE "ReportTargetType" AS ENUM (
    'PROPERTY',
    'USER',
    'MESSAGE_THREAD'
);

CREATE TYPE "PropertyVerificationDocumentType" AS ENUM (
    'OWNERSHIP_DOCUMENT',
    'UTILITY_BILL',
    'PROPERTY_PROOF'
);

ALTER TABLE "VerificationDocument"
ADD COLUMN "rejectionReason" TEXT,
ADD COLUMN "reviewedById" TEXT;

CREATE TABLE "PropertyVerificationDocument" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "type" "PropertyVerificationDocumentType" NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "rejectionReason" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyVerificationDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "targetType" "ReportTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "propertyId" TEXT,
    "reportedUserId" TEXT,
    "type" "ReportType" NOT NULL,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT NOT NULL,
    "resolution" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT,
    "action" "AdminAuditAction" NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "previousState" JSONB,
    "newState" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VerificationDocument_reviewedById_idx" ON "VerificationDocument"("reviewedById");
CREATE INDEX "PropertyVerificationDocument_propertyId_status_idx" ON "PropertyVerificationDocument"("propertyId", "status");
CREATE INDEX "PropertyVerificationDocument_reviewedById_idx" ON "PropertyVerificationDocument"("reviewedById");
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");
CREATE INDEX "Report_targetType_targetId_idx" ON "Report"("targetType", "targetId");
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");
CREATE INDEX "Report_propertyId_idx" ON "Report"("propertyId");
CREATE INDEX "Report_reportedUserId_idx" ON "Report"("reportedUserId");
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");
CREATE INDEX "AdminAuditLog_action_createdAt_idx" ON "AdminAuditLog"("action", "createdAt");
CREATE INDEX "AdminAuditLog_targetType_targetId_idx" ON "AdminAuditLog"("targetType", "targetId");

ALTER TABLE "PropertyVerificationDocument"
ADD CONSTRAINT "PropertyVerificationDocument_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
ADD CONSTRAINT "Report_reporterId_fkey"
FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Report"
ADD CONSTRAINT "Report_reportedUserId_fkey"
FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Report"
ADD CONSTRAINT "Report_propertyId_fkey"
FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AdminAuditLog"
ADD CONSTRAINT "AdminAuditLog_adminId_fkey"
FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
