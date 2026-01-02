-- Create Settings Table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default Base Pool if not exists
INSERT INTO settings (key, value)
VALUES ('base_pool', '10000')
ON CONFLICT (key) DO NOTHING;
