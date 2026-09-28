CREATE TABLE public.meta_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  pixel_id TEXT NOT NULL UNIQUE,
  token_ciphertext TEXT NOT NULL,
  token_iv TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
GRANT ALL ON public.meta_pixels TO service_role;
ALTER TABLE public.meta_pixels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to meta pixels" ON public.meta_pixels FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE TABLE public.meta_pixel_deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL,
  pixel_id UUID NOT NULL REFERENCES public.meta_pixels(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL DEFAULT 'Purchase',
  event_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (order_id, pixel_id, event_name)
);
GRANT ALL ON public.meta_pixel_deliveries TO service_role;
ALTER TABLE public.meta_pixel_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to meta pixel deliveries" ON public.meta_pixel_deliveries FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

CREATE INDEX meta_pixels_active_idx ON public.meta_pixels (is_active);
CREATE INDEX meta_pixel_deliveries_order_idx ON public.meta_pixel_deliveries (order_id);
CREATE INDEX meta_pixel_deliveries_status_idx ON public.meta_pixel_deliveries (status);

CREATE TRIGGER update_meta_pixels_updated_at BEFORE UPDATE ON public.meta_pixels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meta_pixel_deliveries_updated_at BEFORE UPDATE ON public.meta_pixel_deliveries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();