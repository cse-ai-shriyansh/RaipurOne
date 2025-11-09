-- Supabase Migration Schema
-- Run this in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- USERS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  username TEXT DEFAULT 'Anonymous',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  chat_id TEXT NOT NULL,
  is_bot BOOLEAN DEFAULT FALSE,
  tickets_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_chat_id ON users(chat_id);

-- ======================
-- TICKETS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  username TEXT DEFAULT 'Anonymous',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  query TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('support', 'billing', 'technical', 'general', 'other')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in-progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  notes TEXT DEFAULT '',
  assigned_to TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_category ON tickets(category);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- ======================
-- TICKET RESPONSES TABLE
-- ======================
CREATE TABLE IF NOT EXISTS ticket_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id TEXT NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on ticket_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_ticket_responses_ticket_id ON ticket_responses(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_responses_created_at ON ticket_responses(created_at);

-- ======================
-- DEPARTMENT TICKETS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS department_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id TEXT UNIQUE NOT NULL,
  original_ticket_id TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('roadway', 'cleaning', 'drainage', 'water-supply', 'general', 'invalid', 'garbage')),
  request_type TEXT NOT NULL CHECK (request_type IN ('valid', 'invalid', 'garbage')),
  user_id TEXT NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  original_query TEXT NOT NULL,
  simplified_summary TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in-progress', 'resolved', 'closed')),
  confidence NUMERIC,
  reasoning TEXT,
  suggested_actions TEXT[],
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_dept_tickets_ticket_id ON department_tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_dept_tickets_original_id ON department_tickets(original_ticket_id);
CREATE INDEX IF NOT EXISTS idx_dept_tickets_department ON department_tickets(department);
CREATE INDEX IF NOT EXISTS idx_dept_tickets_request_type ON department_tickets(request_type);
CREATE INDEX IF NOT EXISTS idx_dept_tickets_status ON department_tickets(status);
CREATE INDEX IF NOT EXISTS idx_dept_tickets_user_id ON department_tickets(user_id);

-- ======================
-- IMAGES TABLE
-- ======================
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id TEXT REFERENCES tickets(ticket_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  storage_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_images_ticket_id ON images(ticket_id);
CREATE INDEX IF NOT EXISTS idx_images_user_id ON images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at DESC);

-- ======================
-- FUNCTIONS AND TRIGGERS
-- ======================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for tickets table
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================
-- ROW LEVEL SECURITY (Optional)
-- ======================
-- Enable RLS if you want additional security
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE ticket_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE department_tickets ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- ======================
-- STORAGE BUCKET FOR IMAGES
-- ======================
-- Run this after creating the tables
-- Go to Storage in Supabase Dashboard and create a bucket named 'ticket-images'
-- Or run this in SQL:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-images', 'ticket-images', true);

-- ======================
-- SAMPLE QUERIES
-- ======================
-- Get all tickets with their responses
-- SELECT t.*, json_agg(tr.*) as responses 
-- FROM tickets t 
-- LEFT JOIN ticket_responses tr ON t.ticket_id = tr.ticket_id 
-- GROUP BY t.id;

-- Get dashboard statistics
-- SELECT 
--   COUNT(*) as total,
--   COUNT(*) FILTER (WHERE status = 'open') as open,
--   COUNT(*) FILTER (WHERE status = 'in-progress') as in_progress,
--   COUNT(*) FILTER (WHERE status = 'resolved') as resolved
-- FROM tickets;
