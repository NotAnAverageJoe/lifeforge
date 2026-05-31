-- ============================================================
-- Row Level Security policies for all LifeForge tables
--
-- Expected schema (create tables before applying if they don't exist):
--
--   habits             (id text PK, user_id uuid, data jsonb, updated_at timestamptz)
--   characters         (user_id uuid PK, data jsonb, updated_at timestamptz)
--   user_xp            (user_id uuid PK, total_xp integer, updated_at timestamptz)
--   campaign_completions (user_id uuid, campaign_id text, data jsonb, updated_at timestamptz,
--                         PRIMARY KEY (user_id, campaign_id))
--
-- Apply with: supabase db push  OR  paste into Supabase SQL editor
-- ============================================================

-- ── habits ────────────────────────────────────────────────
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "habits_owner" ON habits;
CREATE POLICY "habits_owner" ON habits
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── characters ────────────────────────────────────────────
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "characters_owner" ON characters;
CREATE POLICY "characters_owner" ON characters
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── user_xp ───────────────────────────────────────────────
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_xp_owner" ON user_xp;
CREATE POLICY "user_xp_owner" ON user_xp
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── campaign_completions ──────────────────────────────────
ALTER TABLE campaign_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "campaign_completions_owner" ON campaign_completions;
CREATE POLICY "campaign_completions_owner" ON campaign_completions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
