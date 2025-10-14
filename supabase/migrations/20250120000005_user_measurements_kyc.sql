-- Add body measurements and KYC fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS body_measurements TEXT,
ADD COLUMN IF NOT EXISTS kyc_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected', 'under_review')),
ADD COLUMN IF NOT EXISTS kyc_documents JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS kyc_notes TEXT,
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.body_measurements IS 'Comma-separated body measurements: height,weight,chest,waist,hips,inseam,shoulder,sleeve';
COMMENT ON COLUMN public.profiles.kyc_completed IS 'Whether user has completed KYC process';
COMMENT ON COLUMN public.profiles.kyc_status IS 'KYC verification status: pending, approved, rejected, under_review';
COMMENT ON COLUMN public.profiles.kyc_documents IS 'JSON object containing KYC document references';
COMMENT ON COLUMN public.profiles.kyc_notes IS 'Admin notes about KYC verification';
COMMENT ON COLUMN public.profiles.kyc_verified_at IS 'Timestamp when KYC was verified';
COMMENT ON COLUMN public.profiles.admin_notes IS 'General admin notes about the user';

-- Create indexes for KYC queries
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_status ON public.profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_profiles_kyc_completed ON public.profiles(kyc_completed);

-- Update RLS policies to allow users to update their own KYC data
CREATE POLICY "Users can update their own KYC data" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow admins to manage all KYC data
CREATE POLICY "Admins can manage KYC data" ON public.profiles
    FOR ALL USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE role = 'admin'
        )
    );
