-- Migration 0010: Persistent alert dismissals

-- Each row records that a school dismissed a specific alert.
-- `tipo` is the alert type (baixa_ocupacao, pack_a_expirar, etc.).
-- `entity_id` is the UUID of the entity that triggered the alert
--   (session_id, booking_id, pack_purchase_id) or NULL for type-only alerts
--   like semana_vazia.
-- The UNIQUE constraint prevents duplicates if the user clicks dismiss twice.

CREATE TABLE IF NOT EXISTS alert_dismissals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  entity_id uuid,
  dismissed_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_alert_dismissals_school_tipo_entity
  ON alert_dismissals (school_id, tipo, COALESCE(entity_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Enable RLS
ALTER TABLE alert_dismissals ENABLE ROW LEVEL SECURITY;

-- Owner can read their own dismissals
CREATE POLICY alert_dismissals_select_owner ON alert_dismissals
  FOR SELECT
  USING (
    school_id IN (
      SELECT id FROM schools WHERE owner_user_id = auth.uid()
    )
  );

-- Owner can insert/delete their own dismissals
CREATE POLICY alert_dismissals_insert_owner ON alert_dismissals
  FOR INSERT
  WITH CHECK (
    school_id IN (
      SELECT id FROM schools WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY alert_dismissals_delete_owner ON alert_dismissals
  FOR DELETE
  USING (
    school_id IN (
      SELECT id FROM schools WHERE owner_user_id = auth.uid()
    )
  );
