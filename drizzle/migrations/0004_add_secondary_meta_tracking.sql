ALTER TABLE public.pix_orders
  ADD COLUMN IF NOT EXISTS fb2_sent_at timestamptz;