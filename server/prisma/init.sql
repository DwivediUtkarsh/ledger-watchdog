-- Initial database setup for Ledger Watchdog
-- This file is executed when the PostgreSQL container starts

-- Create extensions for better performance and functionality
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For trigram similarity searches
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For GIN indexes on multiple columns

-- Create custom types (these will be managed by Prisma migrations later)
-- This is just for initial setup if needed

-- Set timezone
SET timezone = 'UTC';

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Note: Tables and triggers will be created by Prisma migrations
-- This file is mainly for extensions and utility functions




