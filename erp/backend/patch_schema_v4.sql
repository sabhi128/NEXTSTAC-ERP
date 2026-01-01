-- PATCH V4: Fix Attendance ID Only (Leave Users alone)

-- 1. Change Attendance ID to TEXT (found "test-..." values locally)
ALTER TABLE attendance ALTER COLUMN id TYPE TEXT;

-- 2. Change Employee History ID to TEXT (just in case)
ALTER TABLE employee_history ALTER COLUMN id TYPE TEXT;

-- 3. Payments ID? Invoices ID? 
-- Sync passed for them, so they are likely fine or empty.

-- DO NOT change users.id (It is UUID and has dependencies)
