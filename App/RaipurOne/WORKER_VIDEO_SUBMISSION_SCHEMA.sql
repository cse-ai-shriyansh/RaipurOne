-- ================================================================
-- WORKER VIDEO SUBMISSION & ADMIN APPROVAL SYSTEM
-- ================================================================
-- Add to existing workers_tasks table for video/doc submissions
-- Run this in Supabase SQL Editor
-- ================================================================

-- Add new columns to workers_tasks table
ALTER TABLE workers_tasks 
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS document_url TEXT,
ADD COLUMN IF NOT EXISTS submission_notes TEXT,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS admin_review_status TEXT DEFAULT 'pending', -- pending, approved, rejected
ADD COLUMN IF NOT EXISTS admin_review_notes TEXT,
ADD COLUMN IF NOT EXISTS reviewed_by TEXT,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_workers_tasks_review_status ON workers_tasks(admin_review_status);

-- Update existing tickets table to store resolution files
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS resolution_video_url TEXT,
ADD COLUMN IF NOT EXISTS resolution_document_url TEXT,
ADD COLUMN IF NOT EXISTS resolved_by_worker_id UUID REFERENCES workers(id);

-- Create notifications table for workers
CREATE TABLE IF NOT EXISTS worker_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- assignment, approval, rejection
  task_id UUID REFERENCES workers_tasks(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_notifications_worker ON worker_notifications(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_notifications_read ON worker_notifications(read);

-- ✅ Worker video submission and admin approval system ready!
-- Workers can now submit live videos and documents
-- Admins can review and approve/reject submissions
