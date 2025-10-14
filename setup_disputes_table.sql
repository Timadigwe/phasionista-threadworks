-- Create disputes table for admin dispute resolution
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.escrow_orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  designer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed')),
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_disputes_order_id ON public.disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer_id ON public.disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_designer_id ON public.disputes(designer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON public.disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created_at ON public.disputes(created_at);

-- Enable RLS
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own disputes" ON public.disputes
    FOR SELECT USING (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id
    );

CREATE POLICY "Users can create disputes" ON public.disputes
    FOR INSERT WITH CHECK (
        auth.uid() = customer_id OR 
        auth.uid() = designer_id
    );

CREATE POLICY "Admins can manage all disputes" ON public.disputes
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role = 'admin'
        )
    );

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type 
FROM information_schema.columns 
WHERE table_name = 'disputes' 
ORDER BY ordinal_position;
