-- ================================================================
-- WORKER VIDEO SUBMISSION & ADMIN APPROVAL SYSTEM
-- ================================================================
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add columns to workers_tasks for video/document submission
ALTER TABLE workers_tasks 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS submission_notes TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_review_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS admin_review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Add columns to tickets for resolution files
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS resolution_video_url TEXT,
ADD COLUMN IF NOT EXISTS resolution_document_url TEXT,
ADD COLUMN IF NOT EXISTS resolved_by_worker_id UUID REFERENCES workers(id);

-- Create worker notifications table
CREATE TABLE IF NOT EXISTS worker_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  task_id UUID REFERENCES workers_tasks(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_notifications_worker ON worker_notifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_workers_tasks_review ON workers_tasks(admin_review_status);

-- ✅ Schema updated! Workers can now submit videos and documents for admin approval
