-- Fix RLS policies for system operations

-- Update notifications policies to allow system operations
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Update escrow_orders policies to allow system operations
DROP POLICY IF EXISTS "Customers can create orders" ON public.escrow_orders;
CREATE POLICY "Customers can create orders" ON public.escrow_orders
    FOR INSERT WITH CHECK (true);

-- Allow system to update escrow orders (for payment confirmation)
CREATE POLICY "System can update escrow orders" ON public.escrow_orders
    FOR UPDATE WITH CHECK (true);

-- Allow system to read escrow orders for notifications
CREATE POLICY "System can read escrow orders" ON public.escrow_orders
    FOR SELECT USING (true);

-- Allow system to read profiles for notifications
CREATE POLICY "System can read profiles" ON public.profiles
    FOR SELECT USING (true);

-- Allow system to read clothes for notifications
CREATE POLICY "System can read clothes" ON public.clothes
    FOR SELECT USING (true);
