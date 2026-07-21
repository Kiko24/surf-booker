CREATE OR REPLACE FUNCTION increment_pack_credit(p_purchase_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining int;
BEGIN
  UPDATE pack_purchases
  SET
    lessons_remaining = lessons_remaining + 1,
    status = 'active'
  WHERE
    id = p_purchase_id
    AND status IN ('active', 'exhausted')
  RETURNING lessons_remaining INTO v_remaining;

  RETURN FOUND;
END;
$$;
