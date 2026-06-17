
-- =========================================================
-- Phase 1: Atomic RPCs for sales completion and due collection,
-- plus IMEI uniqueness when stock is in-hand.
-- =========================================================

-- Partial unique index on IMEI: only when product still has stock.
-- Skips if existing data violates it; admins must clean duplicates first.
DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS products_imei_active_unique
      ON public.products (imei)
      WHERE imei IS NOT NULL AND stock_quantity > 0;
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'IMEI duplicates exist among in-stock products; skipping unique index.';
  END;
END $$;

-- Hot-path indexes
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON public.sales (created_at DESC);
CREATE INDEX IF NOT EXISTS sales_customer_id_idx ON public.sales (customer_id);
CREATE INDEX IF NOT EXISTS sale_items_sale_id_idx ON public.sale_items (sale_id);
CREATE INDEX IF NOT EXISTS due_payments_sale_id_idx ON public.due_payments (sale_id);
CREATE INDEX IF NOT EXISTS products_barcode_idx ON public.products (barcode);
CREATE INDEX IF NOT EXISTS activity_logs_user_created_idx ON public.activity_logs (user_id, created_at DESC);

-- =========================================================
-- complete_sale(payload jsonb) -> jsonb
-- Atomically inserts sale + sale_items and decrements stock.
-- =========================================================
CREATE OR REPLACE FUNCTION public.complete_sale(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_updated integer;
  v_product_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'অননুমোদিত অনুরোধ' USING ERRCODE = '42501';
  END IF;

  IF jsonb_array_length(COALESCE(payload->'items','[]'::jsonb)) = 0 THEN
    RAISE EXCEPTION 'কার্ট খালি' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.sales (
    user_id, customer_id, total_amount, payment_method, status,
    instant_customer_name, instant_customer_phone, paid_amount, due_amount
  ) VALUES (
    v_user_id,
    NULLIF(payload->>'customer_id','')::uuid,
    (payload->>'total_amount')::numeric,
    COALESCE(payload->>'payment_method','cash'),
    'completed',
    NULLIF(payload->>'instant_customer_name',''),
    NULLIF(payload->>'instant_customer_phone',''),
    COALESCE((payload->>'paid_amount')::numeric, 0),
    COALESCE((payload->>'due_amount')::numeric, 0)
  )
  RETURNING id INTO v_sale_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(payload->'items') LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'অবৈধ পরিমাণ' USING ERRCODE = '22023';
    END IF;

    -- Atomic stock decrement with guard
    UPDATE public.products
       SET stock_quantity = stock_quantity - v_qty
     WHERE id = v_product_id
       AND stock_quantity >= v_qty
    RETURNING 1 INTO v_updated;

    IF v_updated IS NULL THEN
      SELECT name INTO v_product_name FROM public.products WHERE id = v_product_id;
      RAISE EXCEPTION 'স্টক অপ্রতুল: %', COALESCE(v_product_name, v_product_id::text)
        USING ERRCODE = 'P0001';
    END IF;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, total_price)
    VALUES (
      v_sale_id,
      v_product_id,
      v_qty,
      (v_item->>'unit_price')::numeric,
      (v_item->>'total_price')::numeric
    );
  END LOOP;

  RETURN jsonb_build_object('sale_id', v_sale_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_sale(jsonb) TO authenticated;

-- =========================================================
-- collect_due(sale_id uuid, amount numeric, method text, notes text)
-- Atomically records a due payment and updates the sale balances.
-- =========================================================
CREATE OR REPLACE FUNCTION public.collect_due(
  p_sale_id uuid,
  p_amount numeric,
  p_method text DEFAULT 'cash',
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_current_due numeric;
  v_current_paid numeric;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'অননুমোদিত অনুরোধ' USING ERRCODE = '42501';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'অবৈধ পরিমাণ' USING ERRCODE = '22023';
  END IF;

  SELECT due_amount, paid_amount
    INTO v_current_due, v_current_paid
    FROM public.sales
   WHERE id = p_sale_id
   FOR UPDATE;

  IF v_current_due IS NULL THEN
    RAISE EXCEPTION 'বিক্রয় পাওয়া যায়নি' USING ERRCODE = 'P0002';
  END IF;

  IF p_amount > v_current_due THEN
    RAISE EXCEPTION 'বাকির চেয়ে বেশি আদায় করা যাবে না' USING ERRCODE = '22023';
  END IF;

  INSERT INTO public.due_payments (sale_id, amount, payment_method, notes, collected_by)
  VALUES (p_sale_id, p_amount, COALESCE(p_method,'cash'), NULLIF(p_notes,''), v_user_id);

  UPDATE public.sales
     SET due_amount = v_current_due - p_amount,
         paid_amount = COALESCE(v_current_paid,0) + p_amount
   WHERE id = p_sale_id;

  RETURN jsonb_build_object(
    'sale_id', p_sale_id,
    'new_due', v_current_due - p_amount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.collect_due(uuid, numeric, text, text) TO authenticated;
