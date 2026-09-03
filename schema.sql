-- TarroBid Database Schema
-- Run this once in your Neon Postgres console

-- Agents table (PAs for now, PEs later)
CREATE TABLE IF NOT EXISTS agents (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  agent_type TEXT NOT NULL DEFAULT 'PA', -- 'PA' or 'PE'
  adherence NUMERIC(5,2) NOT NULL DEFAULT 0,
  aht INTEGER NOT NULL DEFAULT 0, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  shift_type TEXT NOT NULL DEFAULT 'PA', -- 'PA' or 'PE'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bids table (up to 3 preferences per agent)
CREATE TABLE IF NOT EXISTS bids (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  pref1_shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
  pref2_shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
  pref3_shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id)
);

-- Results table (final assignments after running)
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER REFERENCES agents(id) ON DELETE CASCADE,
  shift_id INTEGER REFERENCES shifts(id) ON DELETE SET NULL,
  preference_used INTEGER, -- 1, 2, or 3 (null = unassigned)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Archive table (stores past months)
CREATE TABLE IF NOT EXISTS archive (
  id SERIAL PRIMARY KEY,
  month_label TEXT NOT NULL, -- e.g. "August 2026"
  agent_type TEXT NOT NULL DEFAULT 'PA',
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  data JSONB NOT NULL -- full snapshot: agents, shifts, results
);
