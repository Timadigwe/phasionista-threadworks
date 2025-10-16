-- KYC Verification Fields Setup
-- Run this in your Supabase SQL Editor to ensure all KYC fields are properly set up

-- Add KYC fields to profiles table if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS date_of_birth DATE,
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS id_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS id_front_image TEXT,
ADD COLUMN IF NOT EXISTS id_back_image TEXT,
ADD COLUMN IF NOT EXISTS selfie_image TEXT,
ADD COLUMN IF NOT EXISTS additional_documents TEXT[];

-- Create storage bucket for KYC documents if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for KYC documents storage
CREATE POLICY "Users can upload their own KYC documents" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own KYC documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all KYC documents" ON storage.objects
FOR SELECT USING (
  bucket_id = 'kyc-documents' AND
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Update existing RLS policies to include new KYC fields
-- Allow users to update their own KYC information
CREATE POLICY "Users can update their own KYC data" ON public.profiles
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow admins to update KYC status
CREATE POLICY "Admins can update KYC status" ON public.profiles
FOR UPDATE USING (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Verify the setup
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
  'date_of_birth', 'phone_number', 'id_type', 'id_number', 
  'id_front_image', 'id_back_image', 'selfie_image', 'additional_documents',
  'kyc_status', 'kyc_completed', 'kyc_notes'
)
ORDER BY column_name;
