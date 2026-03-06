-- Migration: Atomic order creation RPC called from the payment webhook
-- Creates order + order_items + qr_code in a single transaction.
-- Automatically sets status to ready_for_pickup for no-prep vendors.

CREATE OR REPLACE FUNCTION create_order_atomic(
  p_festival_id       UUID,
  p_vendor_id         UUID,
  p_customer_id       UUID,
  p_total_amount      NUMERIC,
  p_mp_payment_id     TEXT,
  p_mp_preference_id  TEXT,
  p_items             JSONB,
  p_notes             TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id       UUID;
  v_item           JSONB;
  v_requires_prep  BOOLEAN;
  v_initial_status order_status := 'confirmed';
BEGIN
  SELECT requires_prep INTO v_requires_prep
  FROM public.vendors WHERE id = p_vendor_id;

  IF NOT v_requires_prep THEN
    v_initial_status := 'ready_for_pickup';
  END IF;

  INSERT INTO public.orders (
    festival_id, vendor_id, customer_id, status, total_amount,
    mp_payment_id, mp_preference_id, notes
  ) VALUES (
    p_festival_id, p_vendor_id, p_customer_id, v_initial_status, p_total_amount,
    p_mp_payment_id, p_mp_preference_id, p_notes
  ) RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    INSERT INTO public.order_items (order_id, menu_item_id, quantity, unit_price, name_snapshot)
    VALUES (
      v_order_id,
      (v_item->>'menu_item_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'unit_price')::NUMERIC,
      v_item->>'name_snapshot'
    );
  END LOOP;

  INSERT INTO public.qr_codes (order_id) VALUES (v_order_id);

  RETURN v_order_id;
END;
$$;
