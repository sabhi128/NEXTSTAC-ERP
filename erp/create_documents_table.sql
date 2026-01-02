-- Create Documents Table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    size TEXT,
    path TEXT,
    uploaded_by TEXT,
    status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: The controller manually provides a UUID string for 'id', so type UUID is appropriate.
-- If the controller uses a string UUID, Postgres UUID type handles it fine.
