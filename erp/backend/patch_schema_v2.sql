-- PATCH V2: Fix Types and Missing Columns for Sync

-- 1. Fix Missing Columns
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vendor VARCHAR(255);

-- 2. Relax constraints on IDs to allow "emp-123" (legacy data)
-- We need to drop FKs first, then change type, then (optionally) re-add.
-- Given the mess, simply changing to TEXT is safer.

-- Drop FKs temporarily (if they exist)
ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_department_id_fkey;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS attendance_employee_id_fkey;
ALTER TABLE leaves DROP CONSTRAINT IF EXISTS leaves_employee_id_fkey;
ALTER TABLE salaries DROP CONSTRAINT IF EXISTS salaries_employee_id_fkey;
ALTER TABLE employee_history DROP CONSTRAINT IF EXISTS employee_history_employee_id_fkey;

-- Change IDs to TEXT
ALTER TABLE employees ALTER COLUMN id TYPE TEXT;
ALTER TABLE attendance ALTER COLUMN employee_id TYPE TEXT;
ALTER TABLE leaves ALTER COLUMN employee_id TYPE TEXT;
ALTER TABLE salaries ALTER COLUMN employee_id TYPE TEXT;
ALTER TABLE employee_history ALTER COLUMN employee_id TYPE TEXT;

-- 3. Fix Numeric errors (allow NULL if empty string passed, handled in DB too?)
-- Script handles this, but ensuring columns are nullable helps
ALTER TABLE employees ALTER COLUMN salary DROP NOT NULL;

-- 4. Ensure Users Table is Open (Login Fix)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public users are viewable by everyone" ON users;
CREATE POLICY "Public users are viewable by everyone" ON users FOR SELECT USING (true);
