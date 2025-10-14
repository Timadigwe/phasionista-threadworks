-- Create escrow_orders table
CREATE TABLE IF NOT EXISTS public.escrow_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    designer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    cloth_id UUID NOT NULL REFERENCES public.clothes(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) NOT NULL CHECK (currency IN ('SOL', 'USDC')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'released', 'cancelled')),
    vault_transaction TEXT,
    release_transaction TEXT,
    actual_amount_received DECIMAL(10,6),
    vault_balance_before DECIMAL(10,6),
    vault_balance_after DECIMAL(10,6),
    delivery_address TEXT,
    special_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_escrow_orders_customer_id ON public.escrow_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_designer_id ON public.escrow_orders(designer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_status ON public.escrow_orders(status);
CREATE INDEX IF NOT EXISTS idx_escrow_orders_created_at ON public.escrow_orders(created_at);

-- Enable RLS
ALTER TABLE public.escrow_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Customers can view their own orders
CREATE POLICY "Customers can view their own orders" ON public.escrow_orders
    FOR SELECT USING (auth.uid() = customer_id);

-- Designers can view orders for their clothes
CREATE POLICY "Designers can view orders for their clothes" ON public.escrow_orders
    FOR SELECT USING (auth.uid() = designer_id);

-- Customers can create orders
CREATE POLICY "Customers can create orders" ON public.escrow_orders
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- Designers can update order status (shipped, delivered)
CREATE POLICY "Designers can update order status" ON public.escrow_orders
    FOR UPDATE USING (auth.uid() = designer_id)
    WITH CHECK (auth.uid() = designer_id);

-- Admins can do everything
CREATE POLICY "Admins can manage all orders" ON public.escrow_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_escrow_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_escrow_orders_updated_at
    BEFORE UPDATE ON public.escrow_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_escrow_orders_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.escrow_orders IS 'Escrow orders for secure payment processing';
COMMENT ON COLUMN public.escrow_orders.amount IS 'Expected payment amount in the specified currency';
COMMENT ON COLUMN public.escrow_orders.currency IS 'Payment currency (SOL or USDC)';
COMMENT ON COLUMN public.escrow_orders.status IS 'Order status: pending, paid, shipped, delivered, released, cancelled';
COMMENT ON COLUMN public.escrow_orders.vault_transaction IS 'Transaction hash when funds are sent to vault';
COMMENT ON COLUMN public.escrow_orders.release_transaction IS 'Transaction hash when funds are released to designer';
COMMENT ON COLUMN public.escrow_orders.actual_amount_received IS 'Actual amount received in vault (may differ from expected due to fees)';
COMMENT ON COLUMN public.escrow_orders.vault_balance_before IS 'Vault balance before the payment transaction';
COMMENT ON COLUMN public.escrow_orders.vault_balance_after IS 'Vault balance after the payment transaction';
