ALTER TABLE public.pix_orders
  ADD COLUMN IF NOT EXISTS fb_fbp text,
  ADD COLUMN IF NOT EXISTS fb_fbc text,
  ADD COLUMN IF NOT EXISTS fb_event_id text,
  ADD COLUMN IF NOT EXISTS fb_sent_at timestamptz;