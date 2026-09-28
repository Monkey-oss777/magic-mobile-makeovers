CREATE POLICY "No direct access to pix orders"
ON public.pix_orders
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);