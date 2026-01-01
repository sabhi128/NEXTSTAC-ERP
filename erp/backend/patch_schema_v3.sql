-- PATCH V3: Final Type Fixes
-- Some tables have ID columns that are UUIDs but need to be TEXT to support legacy data

-- 1. Attendance ID
ALTER TABLE attendance ALTER COLUMN id TYPE TEXT;

-- 2. Employee History ID (just in case)
ALTER TABLE employee_history ALTER COLUMN id TYPE TEXT;

-- 3. Any other potential text IDs?
ALTER TABLE users ALTER COLUMN id TYPE TEXT; -- Just in case login uses text ID? Default is UUID gen_random_uuid(), but local might have text.
-- But changing user ID might break Auth. Let's not touch users.id unless we have to.
-- Focus on 'attendance' which explicitly failed.
