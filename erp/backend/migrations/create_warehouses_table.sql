-- Create Warehouses Table
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    location TEXT,
    capacity TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security (RLS)
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;

-- Create Policy: Allow public read access (or authenticated only, adjusting as per app needs)
CREATE POLICY "Enable read access for all users" ON warehouses FOR SELECT USING (true);

-- Create Policy: Allow insert for all (or authenticated only)
CREATE POLICY "Enable insert for all users" ON warehouses FOR INSERT WITH CHECK (true);

-- Create Policy: Allow update for all
CREATE POLICY "Enable update for all users" ON warehouses FOR UPDATE USING (true);

-- Create Policy: Allow delete for all
CREATE POLICY "Enable delete for all users" ON warehouses FOR DELETE USING (true);
