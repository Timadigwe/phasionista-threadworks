# Database Setup Guide

## 🗄️ **Required Database Migrations**

To fix the RLS policy violations and enable the order system, you need to run these SQL migrations in your Supabase SQL Editor.

### **1. Create Escrow Orders Table**

```sql
-- Create escrow_orders table
CREATE TABLE public.escrow_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
CREATE INDEX idx_escrow_orders_customer_id ON public.escrow_orders(customer_id);
CREATE INDEX idx_escrow_orders_designer_id ON public.escrow_orders(designer_id);
CREATE INDEX idx_escrow_orders_status ON public.escrow_orders(status);
CREATE INDEX idx_escrow_orders_created_at ON public.escrow_orders(created_at);

-- Enable RLS
ALTER TABLE public.escrow_orders ENABLE ROW LEVEL SECURITY;

-- Policies for customers
CREATE POLICY "Customers can view their own orders" ON public.escrow_orders
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Customers can create orders" ON public.escrow_orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can update their order status to delivered/cancelled" ON public.escrow_orders
    FOR UPDATE USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id AND status IN ('delivered', 'cancelled'));

-- Policies for designers
CREATE POLICY "Designers can view their associated orders" ON public.escrow_orders
    FOR SELECT USING (auth.uid() = designer_id);

CREATE POLICY "Designers can update their order status to shipped" ON public.escrow_orders
    FOR UPDATE USING (auth.uid() = designer_id)
    WITH CHECK (auth.uid() = designer_id AND status = 'shipped');

-- System policies for notifications
CREATE POLICY "System can update escrow orders" ON public.escrow_orders
    FOR UPDATE WITH CHECK (true);

CREATE POLICY "System can read escrow orders" ON public.escrow_orders
    FOR SELECT USING (true);

-- Trigger to update 'updated_at' column
CREATE TRIGGER update_escrow_orders_updated_at
    BEFORE UPDATE ON public.escrow_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

### **2. Create Notifications Table**

```sql
-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('order_placed', 'order_paid', 'order_shipped', 'order_delivered', 'order_cancelled')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies for users
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- System policies for notifications
CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Trigger to update 'updated_at' column
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
```

### **3. Add System Policies for Profiles and Clothes**

```sql
-- Allow system to read profiles for notifications
CREATE POLICY "System can read profiles" ON public.profiles
    FOR SELECT USING (true);

-- Allow system to read clothes for notifications
CREATE POLICY "System can read clothes" ON public.clothes
    FOR SELECT USING (true);
```

## 🔧 **Environment Variables**

Add these to your `.env.local` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Solana Configuration
VITE_SOLANA_RPC_URL=https://api.devnet.solana.com
VITE_VAULT_WALLET=your_vault_wallet_public_key_here
VITE_VAULT_PRIVATE_KEY=your_vault_private_key_here
VITE_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

## 📋 **Steps to Apply**

1. **Go to your Supabase Dashboard**
2. **Navigate to SQL Editor**
3. **Run the first SQL script** (escrow_orders table)
4. **Run the second SQL script** (notifications table)
5. **Run the third SQL script** (system policies)
6. **Add the service role key** to your environment variables
7. **Restart your development server**

## ✅ **Verification**

After running the migrations, you should see these tables in your Supabase dashboard:
- `escrow_orders`
- `notifications`

The order placement should now work without RLS policy violations.
