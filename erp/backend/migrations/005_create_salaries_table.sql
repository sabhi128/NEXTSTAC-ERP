-- Drop table if exists to ensure schema update
DROP TABLE IF EXISTS salaries;

-- Create salaries table
CREATE TABLE salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id TEXT REFERENCES employees(id) ON DELETE CASCADE,
    employee_name TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    status TEXT CHECK (status IN ('Paid', 'Pending')) DEFAULT 'Pending',
    method TEXT DEFAULT 'Bank Transfer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON salaries FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON salaries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON salaries FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON salaries FOR DELETE USING (auth.role() = 'authenticated');
