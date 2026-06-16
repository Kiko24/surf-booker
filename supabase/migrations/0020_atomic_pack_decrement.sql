CREATE OR REPLACE FUNCTION decrement_pack_credit(p_purchase_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining int;
BEGIN
  UPDATE pack_purchases
  SET
    lessons_remaining = lessons_remaining - 1,
    status = CASE WHEN lessons_remaining <= 1 THEN 'exhausted' ELSE status END
  WHERE
    id = p_purchase_id
    AND lessons_remaining > 0
    AND status = 'active'
  RETURNING lessons_remaining INTO v_remaining;

  RETURN FOUND;
END;
$$;
