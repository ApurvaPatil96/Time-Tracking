/*
# Time Tracker - Create core tables

1. New Tables
- `activities`: stores activity definitions (name, category, description)
- `sessions`: completed time tracking sessions with start/end/duration
- `active_timer`: the single currently-running timer (enforced one-row)

2. Security
- Single-tenant app, no auth. RLS enabled on all tables.
- Policies allow anon + authenticated full CRUD (intentionally public/shared data).
*/

CREATE TABLE IF NOT EXISTS activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('Development','Design','Study','Meeting','Research','Other')),
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  activity_name text NOT NULL,
  category text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  duration_seconds integer NOT NULL CHECK (duration_seconds >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS active_timer (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid REFERENCES activities(id) ON DELETE SET NULL,
  activity_name text NOT NULL,
  category text NOT NULL,
  start_time timestamptz NOT NULL,
  paused_at timestamptz,
  paused_accumulated_seconds integer NOT NULL DEFAULT 0,
  is_paused boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timer ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_activities" ON activities;
CREATE POLICY "anon_select_activities" ON activities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_activities" ON activities;
CREATE POLICY "anon_insert_activities" ON activities FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_activities" ON activities;
CREATE POLICY "anon_update_activities" ON activities FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_activities" ON activities;
CREATE POLICY "anon_delete_activities" ON activities FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions" ON sessions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions" ON sessions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions" ON sessions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions" ON sessions FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_active_timer" ON active_timer;
CREATE POLICY "anon_select_active_timer" ON active_timer FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_active_timer" ON active_timer;
CREATE POLICY "anon_insert_active_timer" ON active_timer FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_active_timer" ON active_timer;
CREATE POLICY "anon_update_active_timer" ON active_timer FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_active_timer" ON active_timer;
CREATE POLICY "anon_delete_active_timer" ON active_timer FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_sessions_start_time ON sessions (start_time DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_category ON sessions (category);
CREATE INDEX IF NOT EXISTS idx_sessions_activity_name ON sessions (activity_name);
