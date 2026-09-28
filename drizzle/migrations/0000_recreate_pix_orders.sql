CREATE TABLE public.pix_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT NOT NULL UNIQUE,
  transaction_id TEXT UNIQUE,
  product_name TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_cpf TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  shipping JSONB NOT NULL DEFAULT '{}'::jsonb,
  ab_variant TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  last_webhook JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT ALL ON public.pix_orders TO service_role;

ALTER TABLE public.pix_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX pix_orders_transaction_id_idx ON public.pix_orders (transaction_id);
CREATE INDEX pix_orders_status_idx ON public.pix_orders (status);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_pix_orders_updated_at
BEFORE UPDATE ON public.pix_orders
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();