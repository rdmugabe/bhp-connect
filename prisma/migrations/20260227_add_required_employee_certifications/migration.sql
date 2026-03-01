-- Add new columns to EmployeeDocumentType
ALTER TABLE "EmployeeDocumentType" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "EmployeeDocumentType" ADD COLUMN IF NOT EXISTS "expirationMonths" INTEGER;
ALTER TABLE "EmployeeDocumentType" ADD COLUMN IF NOT EXISTS "isRequired" BOOLEAN NOT NULL DEFAULT false;

-- Create index on isRequired
CREATE INDEX IF NOT EXISTS "EmployeeDocumentType_isRequired_idx" ON "EmployeeDocumentType"("isRequired");

-- Insert required system-level certification types
INSERT INTO "EmployeeDocumentType" ("id", "facilityId", "name", "description", "expirationRequired", "expirationMonths", "isDefault", "isRequired", "isActive", "createdAt", "updatedAt")
VALUES
  ('sys_cpr_cert', NULL, 'CPR Certification', 'Current CPR certification from an approved provider (American Heart Association, Red Cross, etc.)', true, 24, true, true, true, NOW(), NOW()),
  ('sys_first_aid', NULL, 'First Aid Certification', 'Current First Aid certification from an approved provider', true, 24, true, true, true, NOW(), NOW()),
  ('sys_fingerprint', NULL, 'Fingerprint Clearance Card', 'Valid Arizona DPS Fingerprint Clearance Card', true, 72, true, true, true, NOW(), NOW()),
  ('sys_tb_test', NULL, 'TB Test Results', 'Current tuberculosis test results (Mantoux skin test or written statement from medical practitioner)', true, 12, true, true, true, NOW(), NOW()),
  ('sys_tb_training', NULL, 'TB Training Documentation', 'Tuberculosis infection control training documentation', true, 12, true, true, true, NOW(), NOW()),
  ('sys_fall_prevention', NULL, 'Fall Prevention Training', 'Fall prevention and recovery training documentation', true, 12, true, true, true, NOW(), NOW())
ON CONFLICT ("id") DO UPDATE SET
  "description" = EXCLUDED."description",
  "expirationMonths" = EXCLUDED."expirationMonths",
  "isRequired" = EXCLUDED."isRequired",
  "updatedAt" = NOW();
