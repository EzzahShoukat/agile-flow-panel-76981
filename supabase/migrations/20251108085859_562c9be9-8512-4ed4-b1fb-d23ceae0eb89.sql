-- Add deadline field to projects table for timeline tracking
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS deadline timestamp with time zone;