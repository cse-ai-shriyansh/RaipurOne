-- Workers Table Schema
-- This table stores information about workers who can be assigned to tickets

CREATE TABLE IF NOT EXISTS workers (
  id SERIAL PRIMARY KEY,
  worker_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(100),
  password_hash TEXT, -- For worker login
  address TEXT NOT NULL,
  departments TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of departments: WATER, ROAD, GARBAGE, etc.
  work_type VARCHAR(100), -- Plumber, Electrician, Road Worker, etc.
  status VARCHAR(20) DEFAULT 'offline', -- available, busy, offline
  is_active BOOLEAN DEFAULT true, -- For attendance tracking
  active_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 0.00,
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_workers_departments ON workers USING GIN(departments);

-- Add columns to tickets table for worker assignment
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS assigned_worker_id VARCHAR(50) REFERENCES workers(worker_id),
ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS assigned_by VARCHAR(100),
ADD COLUMN IF NOT EXISTS assignment_message TEXT,
ADD COLUMN IF NOT EXISTS assignment_deadline TIMESTAMP,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS completion_notes TEXT,
ADD COLUMN IF NOT EXISTS completion_images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- NO SAMPLE WORKERS - Workers will register through the app

-- Update trigger for timestamps
CREATE OR REPLACE FUNCTION update_workers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workers_update_timestamp
BEFORE UPDATE ON workers
FOR EACH ROW
EXECUTE FUNCTION update_workers_timestamp();

-- Grant permissions (adjust as needed)
-- GRANT SELECT, INSERT, UPDATE ON workers TO your_app_user;
