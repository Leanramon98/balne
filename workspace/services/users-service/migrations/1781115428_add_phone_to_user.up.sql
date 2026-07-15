-- Migration: Add phone column to user table for profile editing
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS phone VARCHAR(255);
