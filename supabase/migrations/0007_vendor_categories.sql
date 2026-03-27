DROP TABLE IF EXISTS public.vendor_categories;

ALTER TABLE public.vendors
  ADD COLUMN IF NOT EXISTS keywords    text[] NOT NULL DEFAULT '{}'
