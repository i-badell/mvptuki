-- Migration: set_updated_at trigger for orders.updated_at
-- Kept in its own file — Supabase CLI pgx parser requires each PL/pgSQL
-- function to be isolated so internal semicolons are not misread as
-- statement boundaries.

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
