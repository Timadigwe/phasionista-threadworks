-- Add base64 image columns to profiles table for KYC storage
-- This bypasses Supabase storage permission issues

-- Add base64 image columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS id_front_image_base64 TEXT,
ADD COLUMN IF NOT EXISTS id_back_image_base64 TEXT,
ADD COLUMN IF NOT EXISTS selfie_image_base64 TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.id_front_image_base64 IS 'Base64 encoded ID front image for KYC verification';
COMMENT ON COLUMN public.profiles.id_back_image_base64 IS 'Base64 encoded ID back image for KYC verification';
COMMENT ON COLUMN public.profiles.selfie_image_base64 IS 'Base64 encoded selfie image for KYC verification';
